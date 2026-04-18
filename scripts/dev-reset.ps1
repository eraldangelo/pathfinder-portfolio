param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$escapedRoot = [Regex]::Escape($projectRoot)

Write-Output "Resetting Next.js dev state for: $projectRoot"

# Stop lingering pathfinder-related next/node/cmd processes.
$targets = Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and
  $_.CommandLine -match $escapedRoot -and
  $_.CommandLine -match "next" -and
  ($_.Name -eq "node.exe" -or $_.Name -eq "cmd.exe")
}

if ($targets) {
  $targetIds = $targets | Select-Object -ExpandProperty ProcessId -Unique
  foreach ($id in $targetIds) {
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  }
  Write-Output ("Stopped process IDs: " + ($targetIds -join ", "))
} else {
  Write-Output "No lingering Next.js processes found for this project."
}

# Clear any remaining listener on requested port.
$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listeners) {
  $listenerIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($id in $listenerIds) {
    Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
  }
  Write-Output ("Stopped listeners on port ${Port}: " + ($listenerIds -join ", "))
} else {
  Write-Output "Port $Port is already free."
}

# Remove stale Next.js lock file if present.
$lockPath = Join-Path $projectRoot ".next\\dev\\lock"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
  Write-Output "Removed stale lock: $lockPath"
} else {
  Write-Output "No stale lock file found."
}

Write-Output "Reset complete."
