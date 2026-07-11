param(
  [string]$OutputDir = ".\backups"
)

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is required before running a backup."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "shoplinkk-$timestamp.dump"

pg_dump $env:DATABASE_URL --format=custom --file=$file
Write-Host "Backup created: $file"
