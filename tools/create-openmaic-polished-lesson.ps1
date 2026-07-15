param(
  [string]$MaicZip = "",
  [string]$AssetsZip = "",
  [string]$Slug = "",
  [string]$Out = "",
  [string]$Save = ""
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

function Get-LessonBaseName([string]$ZipPath) {
  $name = [IO.Path]::GetFileName($ZipPath)
  $name = $name -replace '\.zip$', ''
  $name = $name -replace '\.maic(?:\s*\(\d+\))?$', ''
  $name = $name -replace '\s*\(\d+\)$', ''
  return $name.Trim()
}

function Get-LessonSlug([string]$Name) {
  $slugValue = ($Name.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
  if (-not $slugValue) { $slugValue = "openmaic-lesson" }
  return $slugValue
}

function Find-CompanionAssetsZip([string]$MaicZipPath) {
  $inputDir = Join-Path $Root "inputs\openmaic"
  $lessonBase = Get-LessonBaseName $MaicZipPath
  $lessonSlug = Get-LessonSlug $lessonBase

  $candidates = Get-ChildItem -LiteralPath $inputDir -Filter "*.zip" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -ne $MaicZipPath -and $_.Name -notmatch '\.maic(?:\s*\(\d+\))?\.zip$' }

  $matchingAssets = $candidates |
    Where-Object { (Get-LessonSlug (Get-LessonBaseName $_.FullName)) -eq $lessonSlug } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($matchingAssets) { return $matchingAssets.FullName }

  $latestAssets = $candidates |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($latestAssets) { return $latestAssets.FullName }
  return ""
}

if (-not $MaicZip) {
  $inputDir = Join-Path $Root "inputs\openmaic"
  $latestMaic = Get-ChildItem -LiteralPath $inputDir -Filter "*.zip" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '\.maic(?:\s*\(\d+\))?\.zip$' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($latestMaic) {
    $MaicZip = $latestMaic.FullName
  } else {
    $MaicZip = "$env:USERPROFILE\Downloads\Fractions with Pizza.maic.zip"
  }
}
if (-not $AssetsZip) {
  $AssetsZip = Find-CompanionAssetsZip $MaicZip
  if (-not $AssetsZip) { $AssetsZip = "$env:USERPROFILE\Downloads\Fractions with Pizza.zip" }
} elseif ([IO.Path]::GetFullPath($AssetsZip) -eq [IO.Path]::GetFullPath($MaicZip) -or [IO.Path]::GetFileName($AssetsZip) -match '\.maic(?:\s*\(\d+\))?\.zip$') {
  Write-Warning "AssetsZip points to a MAIC archive; looking for the companion asset ZIP instead."
  $AssetsZip = Find-CompanionAssetsZip $MaicZip
}
if (-not $Slug) {
  $Slug = Get-LessonSlug (Get-LessonBaseName $MaicZip)
} else {
  $expectedSlug = Get-LessonSlug (Get-LessonBaseName $MaicZip)
  if ($Slug -eq "fractions-with-pizza" -and $expectedSlug -ne "fractions-with-pizza") {
    Write-Warning "Ignoring stale slug '$Slug' because the selected lesson is '$expectedSlug'."
    $Slug = $expectedSlug
  }
}

if (-not $Out) {
  $Out = Join-Path $Root "dist\pre_quraan\units\openmaic-classroom\$Slug-standalone.html"
}
if (-not $Save) {
  $Save = Join-Path $Root "outputs\openmaic\$Slug-standalone.html"
}

$WorkDir = Join-Path $Root "outputs\openmaic\work\$Slug"
$MaicDir = Join-Path $WorkDir "maic"
$AssetsDir = Join-Path $WorkDir "assets"
$CombinedDir = Join-Path $WorkDir "combined"
$SlideDir = Join-Path $WorkDir "slides"

function Assert-InWorkspace([string]$PathToCheck) {
  $resolvedRoot = [IO.Path]::GetFullPath("$Root")
  $resolvedPath = [IO.Path]::GetFullPath($PathToCheck)
  if (-not ($resolvedPath.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase))) {
    throw "Refusing to write outside workspace: $PathToCheck"
  }
}

function Copy-Directory([string]$From, [string]$To) {
  New-Item -ItemType Directory -Force $To | Out-Null
  Get-ChildItem -LiteralPath $From -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $To -Recurse -Force
  }
}

Assert-InWorkspace $WorkDir
Assert-InWorkspace $Out
Assert-InWorkspace $Save

if (-not (Test-Path -LiteralPath $MaicZip -PathType Leaf)) { throw "Missing OpenMAIC classroom ZIP: $MaicZip" }
if (-not (Test-Path -LiteralPath $AssetsZip -PathType Leaf)) { throw "Missing OpenMAIC companion ZIP: $AssetsZip" }

if (Test-Path -LiteralPath $WorkDir) {
  Remove-Item -LiteralPath $WorkDir -Recurse -Force
}
New-Item -ItemType Directory -Force $MaicDir,$AssetsDir,$CombinedDir,$SlideDir | Out-Null

Expand-Archive -LiteralPath $MaicZip -DestinationPath $MaicDir -Force
Expand-Archive -LiteralPath $AssetsZip -DestinationPath $AssetsDir -Force

$Manifest = Get-ChildItem -LiteralPath $MaicDir -Filter "manifest.json" -Recurse | Select-Object -First 1
if (-not $Manifest) { throw "No manifest.json found in $MaicZip" }
Copy-Item -LiteralPath $Manifest.FullName -Destination (Join-Path $CombinedDir "manifest.json") -Force

$AudioDir = Get-ChildItem -LiteralPath $MaicDir -Directory -Recurse | Where-Object { $_.Name -eq "audio" } | Select-Object -First 1
if (-not $AudioDir) { throw "No audio folder found in $MaicZip" }
Copy-Directory $AudioDir.FullName (Join-Path $CombinedDir "audio")

$MediaDir = Get-ChildItem -LiteralPath $MaicDir -Directory -Recurse | Where-Object { $_.Name -eq "media" } | Select-Object -First 1
if ($MediaDir) {
  Copy-Directory $MediaDir.FullName (Join-Path $CombinedDir "media")
}

$Pptx = Get-ChildItem -LiteralPath $AssetsDir -Filter "*.pptx" -Recurse | Select-Object -First 1
if ($Pptx) {
  Copy-Item -LiteralPath $Pptx.FullName -Destination (Join-Path $CombinedDir $Pptx.Name) -Force

  $ppt = $null
  $deck = $null
  try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoTrue
    $deck = $ppt.Presentations.Open($Pptx.FullName, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    $deck.Export($SlideDir, "PNG", 1600, 900)
    $deck.Close()
  } catch {
    Write-Warning "PowerPoint slide export failed; slide scenes will use JSON fallback. $($_.Exception.Message)"
  } finally {
    if ($deck) { try { $deck.Close() } catch {} }
    if ($ppt) { $ppt.Quit() }
    if ($deck) { try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($deck) } catch {} }
    if ($ppt) { try { [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt) } catch {} }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
  }
} else {
  Write-Warning "No PPTX found in $AssetsZip; slide scenes will use JSON fallback."
}

Get-ChildItem -LiteralPath $AssetsDir -Filter "*.html" -Recurse | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $CombinedDir $_.Name) -Force
}

node (Join-Path $Root "tools\create-openmaic-standalone-html.js") $CombinedDir $Out $SlideDir

if ($Save -ne $Out) {
  New-Item -ItemType Directory -Force (Split-Path $Save -Parent) | Out-Null
  Copy-Item -LiteralPath $Out -Destination $Save -Force
}

Write-Output ""
Write-Output "Polished OpenMAIC lesson generated."
Write-Output "Served file: $Out"
Write-Output "Saved copy:  $Save"
Write-Output "Work dir:    $WorkDir"
