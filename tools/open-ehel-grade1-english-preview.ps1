$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
# Grade 1 is the one grade that opens on unit 0 -- Alphabet & Sounds, the
# readiness unit. english/grade-1/ is only a redirect shim onto this same URL
# (shared/grade-redirect.js), so go straight there and skip the round trip.
$previewUrl = 'http://localhost:4287/prototypes/ehel-academy/english/?grade=1&unit=0#overview'

try {
  Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 1 | Out-Null
} catch {
  Start-Process -FilePath 'node' -ArgumentList @('tools\serve-src-preview.js') -WorkingDirectory $projectRoot -WindowStyle Hidden
  Start-Sleep -Seconds 1
}

Start-Process $previewUrl
