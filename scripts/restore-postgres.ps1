param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is required before restoring a backup."
}

pg_restore --clean --if-exists --no-owner --dbname=$env:DATABASE_URL $BackupFile
Write-Host "Restore complete: $BackupFile"
