$ErrorActionPreference = "Stop"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run this script in an Administrator PowerShell."
}

$ports = @(4000, 8081, 8082, 19000, 19001, 19002)

foreach ($profile in Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -match "Wi-Fi|Wireless" }) {
  if ($profile.NetworkCategory -ne "Private") {
    Set-NetConnectionProfile -InterfaceIndex $profile.InterfaceIndex -NetworkCategory Private
  }
}

foreach ($port in $ports) {
  $name = "Traveling Dev TCP $port"
  $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
  if (-not $existing) {
    New-NetFirewallRule `
      -DisplayName $name `
      -Direction Inbound `
      -Action Allow `
      -Protocol TCP `
      -LocalPort $port `
      -Profile Private,Public | Out-Null
  }
}

Write-Host "Traveling LAN dev ports are open: $($ports -join ', ')"
Write-Host "Wi-Fi network profile:"
Get-NetConnectionProfile | Select-Object Name, InterfaceAlias, NetworkCategory, IPv4Connectivity | Format-Table -AutoSize
