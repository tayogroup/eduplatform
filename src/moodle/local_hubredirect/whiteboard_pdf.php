<?php
// Serves a generated blank one-page 16:9 PDF for the live-room whiteboard
// swap (see live_session_materials.php). Deliberately standalone - no Moodle
// bootstrap - because the BBB server fetches this URL server-to-server with
// no Moodle session, and generating at runtime keeps the xref byte offsets
// exact regardless of file-transfer line-ending rewrites.

$objects = [
    "1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n",
    "2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n",
    "3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 960 540]/Resources<<>>/Contents 4 0 R>>\nendobj\n",
    "4 0 obj\n<</Length 0>>\nstream\n\nendstream\nendobj\n",
];
$pdf = "%PDF-1.4\n";
$offsets = [];
foreach ($objects as $object) {
    $offsets[] = strlen($pdf);
    $pdf .= $object;
}
$xrefpos = strlen($pdf);
$pdf .= "xref\n0 " . (count($objects) + 1) . "\n0000000000 65535 f \n";
foreach ($offsets as $offset) {
    $pdf .= sprintf("%010d 00000 n \n", $offset);
}
$pdf .= "trailer\n<</Size " . (count($objects) + 1) . "/Root 1 0 R>>\nstartxref\n" . $xrefpos . "\n%%EOF";

header('Content-Type: application/pdf');
header('Content-Length: ' . strlen($pdf));
header('Content-Disposition: inline; filename="Whiteboard.pdf"');
header('Cache-Control: public, max-age=86400');
echo $pdf;
