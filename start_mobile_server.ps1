# Ancient Architecture AR - Mobile Deployment Server
Write-Host ""
Write-Host "========================================"
Write-Host " Ancient Architecture AR - Mobile Server"
Write-Host "========================================"
Write-Host ""

# Check dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

# Build project if dist doesn't exist
if (!(Test-Path "dist")) {
    Write-Host "Building project..."
    npm run build
}

# Get local IP address
Write-Host "Getting local IP address..."
$IP = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp | Where-Object {$_.InterfaceAlias -notmatch "Loopback"} | Select-Object -First 1).IPAddress
if (!$IP) {
    $IP = "127.0.0.1"
    Write-Host "Cannot get IP address, using localhost"
}

Write-Host ""
Write-Host "Starting local server..."
Write-Host "Local access: http://localhost:3000/"
Write-Host "Mobile access: http://$($IP):3000/"
Write-Host ""
Write-Host "Make sure your phone is on the same Wi-Fi network"
Write-Host "Open the above address in your phone browser to experience AR"
Write-Host ""
Write-Host "Press Ctrl+C to stop server"
Write-Host "========================================"
Write-Host ""

# Start serve server, listen on all interfaces
npx serve dist -l 3000 --cors