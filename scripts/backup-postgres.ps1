param(
  [string]$OutputDir = ".\backups",
  [int]$RetentionDays = $(if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 14 })
)

$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL is required before running a backup."
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw "pg_dump was not found. Install PostgreSQL client tools before running backups."
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDir "shoplinkk-$timestamp.dump"

& $pgDump.Source $env:DATABASE_URL "--format=custom" "--no-owner" "--no-privileges" "--file=$file"

$hash = Get-FileHash -Algorithm SHA256 -LiteralPath $file
$hash.Hash | Set-Content -NoNewline -Path "$file.sha256"

Get-ChildItem -LiteralPath $OutputDir -Filter "shoplinkk-*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Force
    Remove-Item -LiteralPath "$($_.FullName).sha256" -Force -ErrorAction SilentlyContinue
  }

Write-Host "Backup created: $file"
Write-Host "SHA256: $($hash.Hash)"
