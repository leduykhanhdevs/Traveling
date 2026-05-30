$ErrorActionPreference = "Stop"

$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" |
  Sort-Object RouteMetric |
  Select-Object -First 1

$ipAddress = $null
if ($defaultRoute) {
  $ipAddress = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.IPAddress -notlike "172.16.*" -and
      $_.IPAddress -notlike "172.17.*" -and
      $_.IPAddress -notlike "172.18.*" -and
      $_.IPAddress -notlike "172.19.*" -and
      $_.IPAddress -notlike "172.2*.*" -and
      $_.IPAddress -notlike "172.30.*" -and
      $_.IPAddress -notlike "172.31.*"
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $ipAddress) {
  $ipAddress = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.InterfaceAlias -match "Wi-Fi|Wireless" -and
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*"
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
}

if (-not $ipAddress) {
  throw "Could not find a LAN IPv4 address. Check Wi-Fi connection."
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ipAddress
$env:EXPO_OFFLINE = "1"
Write-Host "Using Expo LAN host: $ipAddress"
npx expo start --lan -c
