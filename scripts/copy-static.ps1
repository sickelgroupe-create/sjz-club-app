$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$sourceStatic = Join-Path $projectDir 'static'
$targetStatic = Join-Path $projectDir 'dist\static'

if (-not (Test-Path -LiteralPath $sourceStatic)) {
  throw "Static source not found: $sourceStatic"
}

New-Item -ItemType Directory -Force -Path $targetStatic | Out-Null
$excludedRelativePaths = @(
  'images\hero.png',
  'images\profile-space-v2.png',
  'images\hero.optimized.png',
  'images\profile-space-v2.optimized.png'
)

Get-ChildItem -LiteralPath $sourceStatic -Recurse -File -Force | ForEach-Object {
  $relativePath = $_.FullName.Substring($sourceStatic.Length).TrimStart('\')
  if ($excludedRelativePaths -contains $relativePath) { return }
  $destination = Join-Path $targetStatic $relativePath
  $destinationDirectory = Split-Path -Parent $destination
  New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
}

$excludedRelativePaths | ForEach-Object {
  $staleTarget = Join-Path $targetStatic $_
  if (Test-Path -LiteralPath $staleTarget) { Remove-Item -LiteralPath $staleTarget -Force }
}
Write-Output "Static assets copied to $targetStatic"

$compiledConfig = Join-Path $projectDir 'dist\project.config.json'
if (Test-Path -LiteralPath $compiledConfig) {
  $configText = [System.IO.File]::ReadAllText($compiledConfig, [System.Text.Encoding]::UTF8)
  $config = $configText | ConvertFrom-Json
  $config.miniprogramRoot = '.'
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($compiledConfig, ($config | ConvertTo-Json -Depth 10), $utf8NoBom)
}
