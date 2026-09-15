$ErrorActionPreference = 'Stop'
$projectDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$sourceDir = [System.IO.Path]::GetFullPath((Join-Path $projectDir 'dist'))
$targetDir = [System.IO.Path]::GetFullPath((Join-Path $projectDir 'dist-h5'))
$expectedTarget = $projectDir.TrimEnd('\') + '\dist-h5'

if ($targetDir.TrimEnd('\') -ne $expectedTarget) {
  throw "Unsafe H5 archive path: $targetDir"
}

if (-not (Test-Path -LiteralPath (Join-Path $sourceDir 'index.html'))) {
  throw "H5 build output not found: $sourceDir"
}

if (Test-Path -LiteralPath $targetDir) {
  Remove-Item -LiteralPath $targetDir -Recurse -Force
}

New-Item -ItemType Directory -Path $targetDir | Out-Null
Get-ChildItem -LiteralPath $sourceDir -Force | Copy-Item -Destination $targetDir -Recurse -Force
Write-Output "H5 build archived to $targetDir"
