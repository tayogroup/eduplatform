$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
    node tools\create-ehel-vocabulary-elevenlabs-audio.js --scope lecture --voice-id XfNU2rGpBa01ckF309OY
} finally {
    Pop-Location
}
