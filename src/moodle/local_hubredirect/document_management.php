<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/workflow_documentlib.php');

$workspaceid = pqh_current_workspace_id((int)$USER->id, optional_param('workspaceid', 0, PARAM_INT));
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied('Document management requires workspace administrator access.', new moodle_url('/local/hubredirect/workspace_dashboard.php'), 'Document access denied');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$urlparams = ['workspaceid' => $workspaceid];
$notice = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        require_sesskey();
        if (!pqwdoc_ready()) {
            throw new invalid_parameter_exception('Document tables are not ready. Run Moodle upgrade.');
        }
        $action = optional_param('action', '', PARAM_ALPHANUMEXT);
        $now = time();
        if ($action === 'upload_document') {
            $upload = isset($_FILES['document_file']) && is_array($_FILES['document_file']) ? pqwdoc_upload_info($_FILES['document_file']) : null;
            if (!$upload) {
                throw new invalid_parameter_exception('Choose a document file to upload.');
            }
            $documentid = (int)$DB->insert_record('local_prequran_document', (object)[
                'workspaceid' => $workspaceid,
                'studentid' => optional_param('studentid', 0, PARAM_INT),
                'ownerid' => optional_param('ownerid', 0, PARAM_INT),
                'document_type' => optional_param('document_type', 'other', PARAM_ALPHANUMEXT),
                'title' => optional_param('title', '', PARAM_TEXT),
                'document_number' => optional_param('document_number', '', PARAM_TEXT),
                'status' => optional_param('status', 'active', PARAM_ALPHANUMEXT),
                'verification_status' => optional_param('verification_status', 'pending', PARAM_ALPHANUMEXT),
                'verifiedby' => 0,
                'verifiedat' => 0,
                'issuedat' => pqwdoc_date_to_time(optional_param('issuedat', '', PARAM_TEXT)),
                'expiresat' => pqwdoc_date_to_time(optional_param('expiresat', '', PARAM_TEXT)),
                'filename' => (string)$upload['filename'],
                'mimetype' => (string)$upload['mimetype'],
                'filesize' => (int)$upload['size'],
                'contenthash' => '',
                'source_type' => 'upload',
                'source_id' => 0,
                'metadatajson' => pqwdoc_json(['notes' => optional_param('notes', '', PARAM_TEXT)]),
                'uploadedby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $file = pqwdoc_store_upload($documentid, $upload);
            $document = $DB->get_record('local_prequran_document', ['id' => $documentid], '*', MUST_EXIST);
            $document->contenthash = $file->get_contenthash();
            $document->timemodified = time();
            $DB->update_record('local_prequran_document', $document);
            pqwdoc_document_audit($workspaceid, $documentid, (int)$USER->id, 'document_uploaded', ['filename' => (string)$upload['filename'], 'filesize' => (int)$upload['size']]);
            if (optional_param('create_verification_task', 0, PARAM_INT) && pqh_table_exists_safe('local_prequran_work_task')) {
                $taskid = (int)$DB->insert_record('local_prequran_work_task', (object)[
                    'workspaceid' => $workspaceid,
                    'queue' => 'registrar',
                    'tasktype' => 'document_verification',
                    'title' => 'Verify document: ' . (string)$document->title,
                    'description' => 'Document uploaded and waiting for verification.',
                    'status' => 'open',
                    'priority' => 'normal',
                    'assignedto' => 0,
                    'studentid' => (int)$document->studentid,
                    'targettype' => 'document',
                    'targetid' => $documentid,
                    'duedate' => 0,
                    'escalated' => 0,
                    'escalatedto' => 0,
                    'approval_json' => pqwdoc_json(['approval_required' => 1]),
                    'approvedby' => 0,
                    'approvedat' => 0,
                    'createdby' => (int)$USER->id,
                    'closedby' => 0,
                    'closedat' => 0,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
                pqwdoc_task_audit($workspaceid, $taskid, (int)$USER->id, 'task_created_from_document', [], ['documentid' => $documentid]);
            }
            $notice = 'Document uploaded securely.';
        } else if ($action === 'verify_document') {
            $document = $DB->get_record('local_prequran_document', ['id' => optional_param('documentid', 0, PARAM_INT), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $old = ['verification_status' => (string)$document->verification_status, 'status' => (string)$document->status];
            $document->verification_status = optional_param('verification_status', 'verified', PARAM_ALPHANUMEXT);
            $document->status = optional_param('status', 'active', PARAM_ALPHANUMEXT);
            $document->verifiedby = (int)$USER->id;
            $document->verifiedat = $now;
            $document->expiresat = pqwdoc_date_to_time(optional_param('expiresat', '', PARAM_TEXT)) ?: (int)$document->expiresat;
            $document->metadatajson = pqwdoc_json(['verification_note' => optional_param('verification_note', '', PARAM_TEXT)]);
            $document->timemodified = $now;
            $DB->update_record('local_prequran_document', $document);
            pqwdoc_document_audit($workspaceid, (int)$document->id, (int)$USER->id, 'document_verification_updated', $old + ['note' => optional_param('verification_note', '', PARAM_TEXT)]);
            $notice = 'Document verification updated.';
        } else if ($action === 'register_generated') {
            $studentid = optional_param('studentid', 0, PARAM_INT);
            $doctype = optional_param('doc_type', 'certificate', PARAM_ALPHANUMEXT);
            $source = optional_param('source_type', 'certificate', PARAM_ALPHANUMEXT);
            $sourceid = optional_param('source_id', 0, PARAM_INT);
            $key = optional_param('document_key', strtoupper($doctype) . '-' . date('YmdHis'), PARAM_TEXT);
            $documentid = (int)$DB->insert_record('local_prequran_document', (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'ownerid' => $studentid,
                'document_type' => $doctype,
                'title' => optional_param('title', ucfirst($doctype), PARAM_TEXT),
                'document_number' => $key,
                'status' => 'generated',
                'verification_status' => 'system_generated',
                'verifiedby' => (int)$USER->id,
                'verifiedat' => $now,
                'issuedat' => pqwdoc_date_to_time(optional_param('issuedat', '', PARAM_TEXT)) ?: $now,
                'expiresat' => pqwdoc_date_to_time(optional_param('expiresat', '', PARAM_TEXT)),
                'filename' => '',
                'mimetype' => 'application/pdf',
                'filesize' => 0,
                'contenthash' => '',
                'source_type' => $source,
                'source_id' => $sourceid,
                'metadatajson' => pqwdoc_json(['source_note' => optional_param('source_note', '', PARAM_TEXT)]),
                'uploadedby' => (int)$USER->id,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            $generatedid = (int)$DB->insert_record('local_prequran_generated_doc', (object)[
                'workspaceid' => $workspaceid,
                'studentid' => $studentid,
                'documentid' => $documentid,
                'doc_type' => $doctype,
                'source_type' => $source,
                'source_id' => $sourceid,
                'document_key' => $key,
                'status' => optional_param('status', 'ready', PARAM_ALPHANUMEXT),
                'payloadjson' => pqwdoc_json(['title' => optional_param('title', ucfirst($doctype), PARAM_TEXT), 'note' => optional_param('source_note', '', PARAM_TEXT)]),
                'pdfhash' => optional_param('pdfhash', '', PARAM_TEXT),
                'download_url' => optional_param('download_url', '', PARAM_URL),
                'generatedby' => (int)$USER->id,
                'generatedat' => $now,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
            pqwdoc_document_audit($workspaceid, $documentid, (int)$USER->id, 'generated_pdf_registered', ['generatedid' => $generatedid, 'source_type' => $source, 'source_id' => $sourceid]);
            $notice = 'Generated PDF registry row created.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/document_management.php', $urlparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Document Management');
$PAGE->set_heading('Document Management');

$students = pqwdoc_workspace_students($workspaceid);
$staff = pqwdoc_workspace_staff($workspaceid);
$documents = pqh_table_exists_safe('local_prequran_document') ? array_values($DB->get_records_sql("SELECT d.*, su.firstname AS sfirst, su.lastname AS slast, vu.firstname AS vfirst, vu.lastname AS vlast FROM {local_prequran_document} d LEFT JOIN {user} su ON su.id = d.studentid LEFT JOIN {user} vu ON vu.id = d.verifiedby WHERE d.workspaceid = :workspaceid ORDER BY d.timemodified DESC", ['workspaceid' => $workspaceid], 0, 120)) : [];
$generated = pqh_table_exists_safe('local_prequran_generated_doc') ? array_values($DB->get_records('local_prequran_generated_doc', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];
$audits = pqh_table_exists_safe('local_prequran_document_audit') ? array_values($DB->get_records_sql("SELECT a.*, u.firstname, u.lastname FROM {local_prequran_document_audit} a LEFT JOIN {user} u ON u.id = a.actorid WHERE a.workspaceid = :workspaceid ORDER BY a.timecreated DESC", ['workspaceid' => $workspaceid], 0, 80)) : [];
$now = time();
$expiring = 0;
foreach ($documents as $document) {
    if ((int)$document->expiresat > 0 && (int)$document->expiresat <= $now + (30 * DAYSECS) && (string)$document->status !== 'archived') {
        $expiring++;
    }
}

echo $OUTPUT->header();
echo '<style>.pqdoc{max-width:1180px;margin:0 auto}.pqdoc-top{display:flex;justify-content:space-between;margin-bottom:16px}.pqdoc-grid{display:grid;grid-template-columns:360px 1fr;gap:16px}.pqdoc-panel{border:1px solid #dfe7df;border-radius:8px;background:#fff;padding:16px}.pqdoc-field{margin-bottom:10px}.pqdoc-field label{display:block;font-size:12px;font-weight:800;color:#506050;margin-bottom:4px}.pqdoc-input,.pqdoc-select,.pqdoc-textarea{width:100%;border:1px solid #ccd8cf;border-radius:7px;padding:9px}.pqdoc-textarea{min-height:72px}.pqdoc-btn{display:inline-flex;align-items:center;min-height:38px;padding:0 13px;border:1px solid #cfd8d0;border-radius:8px;background:#2f6f4e;color:#fff;font-weight:800;text-decoration:none}.pqdoc-btn--light{background:#f7fbf8;color:#173044}.pqdoc-table{width:100%;border-collapse:collapse}.pqdoc-table th,.pqdoc-table td{border-bottom:1px solid #e7eee8;padding:9px;text-align:left;vertical-align:top}.pqdoc-pill{display:inline-flex;padding:3px 8px;border-radius:999px;background:#eef7ee;font-size:12px;font-weight:800}.pqdoc-muted{color:#617064;font-size:12px}.pqdoc-notice{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#edf8ef}.pqdoc-error{padding:10px 12px;border-radius:8px;margin-bottom:12px;background:#fff0f0;color:#8a1f1f}.pqdoc-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}.pqdoc-metric{border:1px solid #dfe7df;border-radius:8px;padding:10px;background:#f9fcfa}@media(max-width:900px){.pqdoc-grid,.pqdoc-top,.pqdoc-metrics{display:block}.pqdoc-metric{margin-bottom:8px}}</style>';
echo '<div class="pqdoc"><div class="pqdoc-top"><div><h2>Document Management</h2><div class="pqdoc-muted">' . s($workspace->name) . ' student documents, IDs, certificates, consent forms, secure downloads, verification, expiration, and generated PDF registry.</div></div><a class="pqdoc-btn pqdoc-btn--light" href="' . (new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams))->out(false) . '">Workspace</a></div>';
if ($notice !== '') { echo '<div class="pqdoc-notice">' . s($notice) . '</div>'; }
if ($error !== '') { echo '<div class="pqdoc-error">' . s($error) . '</div>'; }
if (!pqwdoc_ready()) { echo '<div class="pqdoc-error">Document schema is not ready. Run Moodle upgrade.</div>'; }
echo '<div class="pqdoc-metrics"><div class="pqdoc-metric"><strong>' . count($documents) . '</strong><div class="pqdoc-muted">documents</div></div><div class="pqdoc-metric"><strong>' . (int)$expiring . '</strong><div class="pqdoc-muted">expiring in 30 days</div></div><div class="pqdoc-metric"><strong>' . count($generated) . '</strong><div class="pqdoc-muted">generated PDFs</div></div></div>';
echo '<div class="pqdoc-grid"><section class="pqdoc-panel"><h3>Secure Upload</h3><form method="post" enctype="multipart/form-data"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="upload_document"><div class="pqdoc-field"><label>Student</label><select class="pqdoc-select" name="studentid"><option value="0">No student</option>';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqdoc-field"><label>Owner</label><select class="pqdoc-select" name="ownerid"><option value="0">Workspace owned</option>';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
foreach ($staff as $user) { echo '<option value="' . (int)$user->id . '">' . s(fullname($user) . ' / ' . $user->workspace_role) . '</option>'; }
echo '</select></div><div class="pqdoc-field"><label>Document type</label><select class="pqdoc-select" name="document_type"><option value="student_id">Student ID</option><option value="identity">Identity document</option><option value="certificate">Certificate</option><option value="consent_form">Consent form</option><option value="invoice">Invoice PDF</option><option value="receipt">Receipt PDF</option><option value="transcript">Transcript PDF</option><option value="other">Other</option></select></div>';
foreach ([['title','Title'],['document_number','Document number'],['issuedat','Issued date'],['expiresat','Expiration date'],['status','Status'],['verification_status','Verification status']] as $field) { echo '<div class="pqdoc-field"><label>' . s($field[1]) . '</label><input class="pqdoc-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqdoc-field"><label>File</label><input class="pqdoc-input" type="file" name="document_file"></div><div class="pqdoc-field"><label>Notes</label><textarea class="pqdoc-textarea" name="notes"></textarea></div><div class="pqdoc-field"><label><input type="checkbox" name="create_verification_task" value="1" checked> Create registrar verification task</label></div><button class="pqdoc-btn" type="submit">Upload Document</button></form><hr><h3>Register Generated PDF</h3><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="register_generated"><div class="pqdoc-field"><label>Student</label><select class="pqdoc-select" name="studentid"><option value="0">No student</option>';
foreach ($students as $student) { echo '<option value="' . (int)$student->id . '">' . s(fullname($student)) . '</option>'; }
echo '</select></div><div class="pqdoc-field"><label>PDF type</label><select class="pqdoc-select" name="doc_type"><option value="invoice">Invoice</option><option value="receipt">Receipt</option><option value="transcript">Transcript</option><option value="certificate">Certificate</option></select></div>';
foreach ([['title','Title'],['source_type','Source type'],['source_id','Source ID'],['document_key','Document key'],['status','Status'],['pdfhash','PDF hash'],['download_url','Download URL'],['issuedat','Issued date'],['expiresat','Expiration date']] as $field) { echo '<div class="pqdoc-field"><label>' . s($field[1]) . '</label><input class="pqdoc-input" name="' . s($field[0]) . '"></div>'; }
echo '<div class="pqdoc-field"><label>Source note</label><textarea class="pqdoc-textarea" name="source_note"></textarea></div><button class="pqdoc-btn" type="submit">Register PDF</button></form></section><section class="pqdoc-panel"><h3>Documents</h3><table class="pqdoc-table"><thead><tr><th>Document</th><th>Student</th><th>Verification</th><th>Download</th></tr></thead><tbody>';
foreach ($documents as $document) {
    $download = pqwdoc_download_url($document);
    echo '<tr><td><strong>#' . (int)$document->id . ' ' . s($document->title) . '</strong><div class="pqdoc-muted">' . s($document->document_type . ' / ' . $document->document_number) . '</div><div class="pqdoc-muted">' . s($document->filename) . '</div></td><td>' . s(trim($document->sfirst . ' ' . $document->slast)) . '</td><td><span class="pqdoc-pill">' . s($document->verification_status) . '</span><div class="pqdoc-muted">Expires ' . s((int)$document->expiresat > 0 ? userdate((int)$document->expiresat, '%Y-%m-%d') : 'never') . '</div><form method="post"><input type="hidden" name="sesskey" value="' . s(sesskey()) . '"><input type="hidden" name="action" value="verify_document"><input type="hidden" name="documentid" value="' . (int)$document->id . '"><select class="pqdoc-select" name="verification_status"><option value="verified">Verified</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select><input class="pqdoc-input" name="status" value="' . s($document->status) . '"><input class="pqdoc-input" name="expiresat" placeholder="Expiration date"><input class="pqdoc-input" name="verification_note" placeholder="Verification note"><button class="pqdoc-btn pqdoc-btn--light">Save</button></form></td><td>' . ($download !== '' ? '<a class="pqdoc-btn pqdoc-btn--light" href="' . s($download) . '">Download</a>' : '<span class="pqdoc-muted">Generated registry only</span>') . '</td></tr>';
}
if (!$documents) { echo '<tr><td colspan="4" class="pqdoc-muted">No documents yet.</td></tr>'; }
echo '</tbody></table><h3>Generated PDFs</h3><table class="pqdoc-table"><thead><tr><th>PDF</th><th>Source</th><th>Status</th></tr></thead><tbody>';
foreach ($generated as $row) { echo '<tr><td><strong>' . s($row->document_key) . '</strong><div class="pqdoc-muted">' . s($row->doc_type) . '</div></td><td>' . s($row->source_type) . ' #' . (int)$row->source_id . '<div class="pqdoc-muted">' . s($row->download_url) . '</div></td><td><span class="pqdoc-pill">' . s($row->status) . '</span><br><a class="pqdoc-btn pqdoc-btn--light" href="' . (new moodle_url('/local/hubredirect/document_pdf.php', ['generatedid' => (int)$row->id]))->out(false) . '">Generate PDF</a></td></tr>'; }
if (!$generated) { echo '<tr><td colspan="3" class="pqdoc-muted">No generated PDF rows yet.</td></tr>'; }
echo '</tbody></table><h3>Audit History</h3><table class="pqdoc-table"><thead><tr><th>Document</th><th>Actor</th><th>Action</th></tr></thead><tbody>';
foreach ($audits as $audit) { echo '<tr><td>#' . (int)$audit->documentid . '</td><td>' . s(trim($audit->firstname . ' ' . $audit->lastname)) . '<div class="pqdoc-muted">' . s(userdate((int)$audit->timecreated)) . '</div></td><td><span class="pqdoc-pill">' . s($audit->action) . '</span></td></tr>'; }
if (!$audits) { echo '<tr><td colspan="3" class="pqdoc-muted">No document audit entries yet.</td></tr>'; }
echo '</tbody></table></section></div></div>';
echo $OUTPUT->footer();
