param(
    [string]$ReleaseName = "",
    [string]$EvidenceSource = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format "yyyyMMdd"
if ($ReleaseName -eq "") {
    $ReleaseName = "quraan-academy-bbb-live-release-$stamp-v01"
}

$deployDir = Join-Path $root "deploy"
$releaseDir = Join-Path $deployDir $ReleaseName
$zipPath = Join-Path $deployDir "$ReleaseName.zip"

if (Test-Path -LiteralPath $releaseDir) {
    throw "Release directory already exists: $releaseDir. Rename it or remove it after review."
}

if (Test-Path -LiteralPath $zipPath) {
    throw "Release zip already exists: $zipPath. Rename it or remove it after review."
}

New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $releaseDir "code") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $releaseDir "docs") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $releaseDir "sql") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $releaseDir "manifest") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $releaseDir "evidence") -Force | Out-Null

$excludedNamePatterns = @(
    "config.php",
    "*.bak",
    "*.tmp",
    "*.log",
    "*.mp4",
    "*.webm",
    "*.mkv",
    "*.zip",
    "*.tar",
    "*.gz",
    "*.dump",
    "*.sql.gz",
    "*sessionToken*",
    "*recording_raw*"
)

function Copy-SafeTree {
    param(
        [string]$Source,
        [string]$Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Source not found: $Source"
    }

    $sourceRoot = (Resolve-Path -LiteralPath $Source).Path
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null

    Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
        $file = $_
        $skip = $false
        foreach ($pattern in $excludedNamePatterns) {
            if ($file.Name -like $pattern) {
                $skip = $true
                break
            }
        }

        if (-not $skip) {
            $relative = $file.FullName.Substring($sourceRoot.Length).TrimStart("\")
            $target = Join-Path $Destination $relative
            $targetDir = Split-Path -Parent $target
            if (-not (Test-Path -LiteralPath $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item -LiteralPath $file.FullName -Destination $target -Force
        }
    }
}

Copy-SafeTree -Source (Join-Path $root "src\moodle\local_prequran") -Destination (Join-Path $releaseDir "code\local_prequran")
Copy-SafeTree -Source (Join-Path $root "src\moodle\local_hubredirect") -Destination (Join-Path $releaseDir "code\local_hubredirect")

$docPatterns = @(
    "bbb-group-*.md",
    "bbb-launch-execution-runbook.md",
    "production-smoke-test.md",
    "bbb-live-*.md"
)

foreach ($pattern in $docPatterns) {
    Get-ChildItem -LiteralPath (Join-Path $root "docs") -Filter $pattern -File | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $releaseDir "docs\$($_.Name)") -Force
    }
}

Get-ChildItem -LiteralPath (Join-Path $root "src\moodle\local_prequran\sql") -Filter "*.sql" -File | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $releaseDir "sql\$($_.Name)") -Force
}

if ($EvidenceSource -ne "") {
    $resolvedEvidence = if ([System.IO.Path]::IsPathRooted($EvidenceSource)) { $EvidenceSource } else { Join-Path $root $EvidenceSource }
    if (Test-Path -LiteralPath $resolvedEvidence) {
        Copy-SafeTree -Source $resolvedEvidence -Destination (Join-Path $releaseDir "evidence\provided")
    }
}

$manifestPath = Join-Path $releaseDir "manifest\release_manifest.md"
$approvalsPath = Join-Path $releaseDir "manifest\approvals.md"
$knownIssuesPath = Join-Path $releaseDir "manifest\known_issues.md"
$verificationPath = Join-Path $releaseDir "manifest\verification_results.md"
$inventoryPath = Join-Path $releaseDir "manifest\file_inventory.txt"

@"
# Release Manifest

Release: $ReleaseName
Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Workspace: $root

## Included

- Moodle plugin code: local_prequran
- Moodle plugin/pages code: local_hubredirect
- Launch documentation and Group verification documentation
- SQL verification scripts
- Evidence folder and approval templates

## Excluded By Policy

- BBB shared secret or provider credentials
- Moodle config.php
- Raw recordings
- Database dumps
- Browser cookies
- Session join URLs or tokens
- Private teacher notes or child-sensitive exports
- Logs that may include secrets or personally identifiable data

## Required Before Production Launch

- Group 12 consistency audit passed
- Group 13 archive audit passed
- Launch readiness SQL passed
- PHP lint passed
- Admin/teacher/student/parent browser smoke test passed
- Privacy and child-safety sign-off completed
- Rollback owner confirmed
"@ | Set-Content -LiteralPath $manifestPath -Encoding UTF8

@"
# Launch Approvals

| Area | Owner | Date | Status | Notes |
| --- | --- | --- | --- | --- |
| Admin operations |  |  | Pending |  |
| Technical deployment |  |  | Pending |  |
| Privacy and child safety |  |  | Pending |  |
| Teacher readiness |  |  | Pending |  |
| Parent support readiness |  |  | Pending |  |
| Rollback owner confirmed |  |  | Pending |  |
"@ | Set-Content -LiteralPath $approvalsPath -Encoding UTF8

@"
# Known Issues

| Issue | Severity | Owner | Workaround | Launch decision |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
"@ | Set-Content -LiteralPath $knownIssuesPath -Encoding UTF8

@"
# Verification Results

Paste or attach evidence here before launch.

## PHP Lint

Pending.

## SQL Checks

- Group 12 consistency audit: Pending.
- Group 13 release archive audit: Pending.
- Launch execution readiness: Pending.

## Browser Smoke Tests

- Admin: Pending.
- Teacher: Pending.
- Student: Pending.
- Parent: Pending.

## Pilot Live Class

Pending.
"@ | Set-Content -LiteralPath $verificationPath -Encoding UTF8

Get-ChildItem -LiteralPath $releaseDir -Recurse -File |
    Sort-Object FullName |
    ForEach-Object { $_.FullName.Substring($releaseDir.Length + 1) } |
    Set-Content -LiteralPath $inventoryPath -Encoding UTF8

Compress-Archive -Path (Join-Path $releaseDir "*") -DestinationPath $zipPath -Force

Write-Output "Release directory: $releaseDir"
Write-Output "Release archive: $zipPath"
Write-Output "Manifest: $manifestPath"
