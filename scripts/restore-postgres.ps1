param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile,
  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"

if (-not $ConfirmRestore) {
  throw "Restore is destructive. Re-run with -ConfirmRestore after confirming you selected the correct database and backup."
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is required before running a restore."
}

$resolvedBackup = Resolve-Path -LiteralPath $BackupFile
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue

if (-not $pgRestore) {
  throw "pg_restore was not found. Install PostgreSQL client tools before running a restore."
}

if (Test-Path -LiteralPath "$($resolvedBackup.Path).sha256") {
  $expectedHash = Get-Content -Raw -LiteralPath "$($resolvedBackup.Path).sha256"
  $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedBackup.Path).Hash
  if ($expectedHash.Trim() -ne $actualHash) {
    throw "Backup checksum does not match. Do not restore this file."
  }
}

& $pgRestore.Source "--clean" "--if-exists" "--no-owner" "--no-privileges" "--dbname=$env:DATABASE_URL" $resolvedBackup.Path

Write-Host "Database restored from: $($resolvedBackup.Path)"
