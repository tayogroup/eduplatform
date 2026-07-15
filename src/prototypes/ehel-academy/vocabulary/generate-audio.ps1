$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")
Push-Location $root
try {
    node tools\create-ehel-vocabulary-elevenlabs-audio.js --scope lesson --voice-id XfNU2rGpBa01ckF309OY
} finally {
    Pop-Location
}
