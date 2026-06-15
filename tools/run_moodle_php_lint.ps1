param(
    [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$php = Join-Path $root "tools\bin\php.cmd"

if (-not (Test-Path -LiteralPath $php)) {
    throw "PHP wrapper not found at $php"
}

$targets = @(
    (Join-Path $root "src\moodle\local_prequran"),
    (Join-Path $root "src\moodle\local_hubredirect"),
    (Join-Path $root "src\moodle\local_ehelhome")
)

$files = foreach ($target in $targets) {
    if (Test-Path -LiteralPath $target) {
        Get-ChildItem -LiteralPath $target -Filter "*.php" -Recurse -File
    }
}

$results = New-Object System.Collections.Generic.List[string]
$failures = New-Object System.Collections.Generic.List[string]

$results.Add("Quraan Academy Moodle PHP lint")
$results.Add("Workspace: $root")
$results.Add("Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$results.Add("Files: $($files.Count)")
$results.Add("")

foreach ($file in $files) {
    $output = & $php -l $file.FullName 2>&1
    $exit = $LASTEXITCODE
    $relative = $file.FullName.Substring($root.Length + 1)
    if ($exit -eq 0) {
        $results.Add("PASS $relative")
    } else {
        $line = "FAIL $relative :: $($output -join ' ')"
        $results.Add($line)
        $failures.Add($line)
    }
}

$results.Add("")
$results.Add("Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')")
$results.Add("Passed: $($files.Count - $failures.Count)")
$results.Add("Failed: $($failures.Count)")

if ($OutFile -ne "") {
    $outPath = if ([System.IO.Path]::IsPathRooted($OutFile)) { $OutFile } else { Join-Path $root $OutFile }
    $outDir = Split-Path -Parent $outPath
    if (-not (Test-Path -LiteralPath $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    Set-Content -LiteralPath $outPath -Value $results -Encoding UTF8
}

$results | ForEach-Object { Write-Output $_ }

if ($failures.Count -gt 0) {
    exit 1
}
