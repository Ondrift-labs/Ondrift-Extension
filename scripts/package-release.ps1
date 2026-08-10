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

Compress-Archive -Path (Join-Path $distPath "*") -DestinationPath $archivePath -CompressionLevel Optimal

$archive = Get-Item -LiteralPath $archivePath
Write-Host "Created $($archive.FullName) ($($archive.Length) bytes)"
