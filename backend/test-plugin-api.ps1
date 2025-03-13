Write-Host "Testing without authentication..."
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/plugins" -Method Get -ContentType "application/json" -ErrorAction SilentlyContinue
if ($response) {
    $response | ConvertTo-Json -Depth 5
} else {
    Write-Host "Error: Authentication required" -ForegroundColor Red
}

Write-Host "`n---------------------------------------`n"

Write-Host "Testing with invalid authentication token..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/plugins" -Method Get -ContentType "application/json" -Headers @{"x-auth-token" = "invalid-token"} -ErrorAction Stop
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n---------------------------------------`n"

Write-Host "Logging in to get a valid token..."
$loginBody = @{
    username = "admin"
    password = "password"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    $token = $loginResponse.token
    Write-Host "Token received: $($token.Substring(0, [Math]::Min(15, $token.Length)))..." -ForegroundColor Green
} catch {
    Write-Host "Error during login: $_" -ForegroundColor Red
    exit
}

Write-Host "`n---------------------------------------`n"

Write-Host "Testing with valid authentication token..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/plugins" -Method Get -ContentType "application/json" -Headers @{"x-auth-token" = $token} -ErrorAction Stop
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} 