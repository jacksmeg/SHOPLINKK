$ErrorActionPreference = "Stop"

$port = if ($env:SHOPLINKK_PORT) { [int]$env:SHOPLINKK_PORT } else { 3004 }
$ip = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  Write-Error "No local network IPv4 address was found. Connect this computer to Wi-Fi or Ethernet and try again."
}

$env:NEXTAUTH_URL = "http://${ip}:${port}"
$env:NEXT_PUBLIC_APP_URL = "http://${ip}:${port}"

Write-Host "ShopLinkk is available on this computer at http://127.0.0.1:${port}" -ForegroundColor Cyan
Write-Host "Open this address on a phone connected to the same Wi-Fi: http://${ip}:${port}" -ForegroundColor Green
Write-Host "Keep this window open while testing. Allow Private network access if Windows Firewall asks." -ForegroundColor Yellow

npx next start -H 0.0.0.0 -p $port
