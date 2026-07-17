$ErrorActionPreference = "Stop"

$javaHome = "C:\jdk17"
$androidHome = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$secretDir = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "ShopLinkk-PlayStore-Secrets"
$secretFile = Join-Path $secretDir "UPLOAD_KEY_V2_README.txt"
$keyPath = Join-Path $secretDir "shoplinkk-upload-key-v2.p12"

if (!(Test-Path $secretFile) -or !(Test-Path $keyPath)) {
  throw "ShopLinkk upload key not found. Ask Codex to prepare the Play Store upload key again."
}

$lines = Get-Content -LiteralPath $secretFile
$storePasswordIndex = [array]::IndexOf($lines, "Keystore password:")
$keyPasswordIndex = [array]::IndexOf($lines, "Key password:")
$storePassword = if ($storePasswordIndex -ge 0) { $lines[$storePasswordIndex + 1] } else { $null }
$keyPassword = if ($keyPasswordIndex -ge 0) { $lines[$keyPasswordIndex + 1] } else { $null }

if (!$storePassword -or !$keyPassword) {
  throw "Could not read the upload key passwords from the local secret file."
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidHome
$env:ANDROID_SDK_ROOT = $androidHome
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $storePassword
$env:BUBBLEWRAP_KEY_PASSWORD = $keyPassword
$env:Path = "$javaHome\bin;$androidHome\bin;$androidHome\platform-tools;$env:Path"

Push-Location (Join-Path $PSScriptRoot "..\android")
try {
  bubblewrap.cmd update --skipVersionUpgrade
  bubblewrap.cmd build --skipPwaValidation --signingKeyPath="$keyPath" --signingKeyAlias="shoplinkk"
}
finally {
  Pop-Location
}
