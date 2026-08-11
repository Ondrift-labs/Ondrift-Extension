$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$packageJson = Get-Content -Raw -LiteralPath (Join-Path $projectRoot "package.json") | ConvertFrom-Json
$version = [string]$packageJson.version
$distPath = Join-Path $projectRoot "dist"
$manifestPath = Join-Path $distPath "manifest.json"
$releasePath = Join-Path $projectRoot "release"
$archivePath = Join-Path $releasePath "ondrift-$version.zip"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Missing dist/manifest.json. Run npm run build before packaging."
}

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
if ([string]$manifest.version -ne $version) {
  throw "package.json version $version does not match dist manifest version $($manifest.version)."
}

New-Item -ItemType Directory -Force -Path $releasePath | Out-Null
if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

# Compress-Archive writes zip entries with backslash path separators on
# Windows PowerShell 5.1, which violates the ZIP spec (entries must use "/").
# Tools that follow the spec strictly (macOS Archive Utility, Linux unzip)
# then treat e.g. "assets\foo.js" as a single literal filename instead of a
# folder, so the extracted extension is missing manifest.json at the top
# level. Build the archive directly with System.IO.Compression instead, and
# force forward slashes for every entry name.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -LiteralPath $distPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip, $_.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal
    ) | Out-Null
  }
} finally {
  $zip.Dispose()
}

$archive = Get-Item -LiteralPath $archivePath
Write-Host "Created $($archive.FullName) ($($archive.Length) bytes)"
