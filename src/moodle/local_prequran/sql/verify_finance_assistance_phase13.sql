-- Phase 13 verification for scholarships, sponsorships, and marketplace payout readiness.
-- Replace mdlgx_ with your Moodle database prefix if needed.
-- This script is phpMyAdmin friendly and does not use named placeholders.

SELECT 'phase13_tables' AS check_name,
       CASE WHEN COUNT(*) = 3 THEN 'ready' ELSE 'missing_tables' END AS status,
       COUNT(*) AS found_table_count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'mdlgx_local_prequran_scholar_award',
      'mdlgx_local_prequran_sponsor_commit',
      'mdlgx_local_prequran_market_payout'
  );

SELECT 'scholarship_awards' AS check_name,
       COUNT(*) AS award_count,
       COALESCE(SUM(CAST(amount AS DECIMAL(18,2))), 0) AS award_total,
       CASE
           WHEN COUNT(*) = 0 THEN 'No scholarship awards have been recorded yet.'
           ELSE 'Scholarship award rows exist.'
       END AS interpretation
FROM mdlgx_local_prequran_scholar_award
WHERE status <> 'void';

SELECT a.id AS awardid,
       a.awardnumber,
       a.status,
       a.awardtype,
       a.fundingsource,
       a.workspaceid,
       a.studentid,
       a.invoiceid,
       i.invoicenumber,
       a.creditnoteid,
       cn.creditnumber,
       a.currency,
       a.amount,
       FROM_UNIXTIME(a.approvedat) AS approved_at,
       a.reason
FROM mdlgx_local_prequran_scholar_award a
JOIN mdlgx_local_prequran_invoice i
  ON i.id = a.invoiceid
LEFT JOIN mdlgx_local_prequran_credit_note cn
  ON cn.id = a.creditnoteid
ORDER BY a.approvedat DESC, a.id DESC
LIMIT 100;

SELECT 'sponsor_commitments' AS check_name,
       COUNT(*) AS commitment_count,
       COALESCE(SUM(CAST(committedamount AS DECIMAL(18,2))), 0) AS committed_total,
       COALESCE(SUM(CAST(balanceamount AS DECIMAL(18,2))), 0) AS sponsor_balance_total,
       CASE
           WHEN COUNT(*) = 0 THEN 'No sponsor commitments have been recorded yet.'
           ELSE 'Sponsor commitment rows exist.'
       END AS interpretation
FROM mdlgx_local_prequran_sponsor_commit
WHERE status <> 'cancelled';

SELECT sc.id AS commitmentid,
       sc.commitmentnumber,
       sc.status,
       sc.workspaceid,
       sc.sponsoraccountid,
       ba.displayname AS sponsor_name,
       sc.studentid,
       sc.invoiceid,
       i.invoicenumber,
       sc.currency,
       sc.committedamount,
       sc.receivedamount,
       sc.balanceamount,
       FROM_UNIXTIME(sc.committedat) AS committed_at,
       FROM_UNIXTIME(sc.expectedat) AS expected_at,
       sc.termsnote
FROM mdlgx_local_prequran_sponsor_commit sc
JOIN mdlgx_local_prequran_invoice i
  ON i.id = sc.invoiceid
LEFT JOIN mdlgx_local_prequran_billing_account ba
  ON ba.id = sc.sponsoraccountid
ORDER BY sc.status ASC, sc.expectedat ASC, sc.id DESC
LIMIT 100;

SELECT 'marketplace_payout_readiness' AS check_name,
       COUNT(*) AS payout_count,
       COALESCE(SUM(CAST(grossamount AS DECIMAL(18,2))), 0) AS gross_total,
       COALESCE(SUM(CAST(platformfee AS DECIMAL(18,2))), 0) AS platform_fee_total,
       COALESCE(SUM(CAST(payoutamount AS DECIMAL(18,2))), 0) AS payout_total,
       CASE
           WHEN COUNT(*) = 0 THEN 'No marketplace payout readiness rows have been recorded yet.'
           ELSE 'Marketplace payout readiness rows exist.'
       END AS interpretation
FROM mdlgx_local_prequran_market_payout
WHERE status <> 'void';

SELECT mp.id AS payoutid,
       mp.payoutnumber,
       mp.status,
       mp.workspaceid,
       mp.teacherid,
       CONCAT(t.firstname, ' ', t.lastname) AS teacher_name,
       mp.studentid,
       mp.invoiceid,
       i.invoicenumber,
       mp.requestid,
       mp.currency,
       mp.grossamount,
       mp.platformfee,
       mp.payoutamount,
       FROM_UNIXTIME(mp.readyat) AS ready_at,
       mp.notes
FROM mdlgx_local_prequran_market_payout mp
JOIN mdlgx_local_prequran_invoice i
  ON i.id = mp.invoiceid
LEFT JOIN mdlgx_user t
  ON t.id = mp.teacherid
ORDER BY mp.status ASC, mp.readyat DESC, mp.id DESC
LIMIT 100;

SELECT 'scholarship_credit_links' AS exception_check,
       a.id AS awardid,
       a.awardnumber,
       a.creditnoteid
FROM mdlgx_local_prequran_scholar_award a
LEFT JOIN mdlgx_local_prequran_credit_note cn
  ON cn.id = a.creditnoteid
WHERE a.status <> 'void'
  AND cn.id IS NULL;

SELECT 'phase13_audit_events' AS check_name,
       COUNT(*) AS audit_event_count,
       CASE
           WHEN COUNT(*) = 0 THEN 'No Phase 13 audit events yet.'
           ELSE 'Phase 13 audit events exist.'
       END AS interpretation
FROM mdlgx_local_prequran_finance_audit
WHERE action IN ('scholarship_award_approved', 'sponsor_commitment_created', 'marketplace_payout_ready');
