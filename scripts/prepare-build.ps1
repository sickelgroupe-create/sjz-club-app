$ErrorActionPreference = 'Stop'
$projectDir = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$targetDir = [System.IO.Path]::GetFullPath((Join-Path $projectDir 'dist'))
$expectedTarget = $projectDir.TrimEnd('\') + '\dist'

if ($targetDir.TrimEnd('\') -ne $expectedTarget) {
  throw "Unsafe build output path: $targetDir"
}

if (Test-Path -LiteralPath $targetDir) {
  # Devtools can retain a handle to the output directory after closing a project.
  # Keep that directory, but remove all previous generated contents. A locked
  # child still fails the build rather than mixing old and new artifacts.
  Get-ChildItem -LiteralPath $targetDir -Force | ForEach-Object {
    $childPath = [System.IO.Path]::GetFullPath($_.FullName)
    if (-not $childPath.StartsWith($expectedTarget + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Unsafe build child path: $childPath"
    }
    Remove-Item -LiteralPath $childPath -Recurse -Force
  }
}

Write-Output "Prepared clean build output: $targetDir"
