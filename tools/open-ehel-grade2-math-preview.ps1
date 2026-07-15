$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://localhost:4287/prototypes/ehel-academy/mathematics/?stage=2&unit=1#overview'

try {
  Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 1 | Out-Null
} catch {
  Start-Process -FilePath 'node' -ArgumentList @('tools\serve-src-preview.js') -WorkingDirectory $projectRoot -WindowStyle Hidden
  Start-Sleep -Seconds 1
}

Start-Process $previewUrl
