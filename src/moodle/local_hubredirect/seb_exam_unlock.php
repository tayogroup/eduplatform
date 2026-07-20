<?php
// Safe Exam Browser quit target. Deliberately standalone (no Moodle
// bootstrap): the URL must match the config's quitURL exactly, and a
// login redirect would change it, so SEB would never quit. SEB exits as
// soon as the browser navigates here; this body only shows if something
// prevented the quit.
header('Cache-Control: private, no-store');
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Exam closed</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f9;color:#0f2237;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
main{max-width:460px;padding:30px;background:#fff;border:1px solid #e4e9ef;border-radius:14px;text-align:center}
h1{margin:0 0 8px;font-size:20px;font-weight:800}
p{margin:0;color:#5b6b7c;font-weight:500;font-size:14px}
</style>
</head>
<body>
<main>
<h1>Exam closed</h1>
<p>Safe Exam Browser should now unlock this computer. If it is still locked, press the quit button and ask your teacher for the exit password.</p>
</main>
</body>
</html>
