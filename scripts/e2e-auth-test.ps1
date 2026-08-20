# E2E test for refresh token reuse detection
$ErrorActionPreference = 'Stop'
$body = '{"email":"test@vync.dev","password":"Passw0rd123"}'

# 1. Login and capture the Set-Cookie header (raw)
$login = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5000/api/v1/auth/login' -Method Post -Body $body -ContentType 'application/json'
$setCookie = $login.Headers['Set-Cookie'] | Select-Object -First 1
$oldToken = [regex]::Match($setCookie, 'vync_refresh_token=([^;]+)').Groups[1].Value
Write-Host "1. Old refresh token captured: $($oldToken.Substring(0,20))..."

# 2. Use it once -> rotates to a new token
$null = Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/refresh' -Method Post -Headers @{Cookie = "vync_refresh_token=$oldToken"}
Write-Host "2. First use of token: OK (rotated)"

# 3. Reuse the OLD token -> must be rejected (reuse detection)
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/refresh' -Method Post -Headers @{Cookie = "vync_refresh_token=$oldToken"} | Out-Null
    Write-Host "3. REUSE: unexpectedly succeeded (BUG)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "3. REUSE blocked with HTTP $status - code: $($err.error.code) - $($err.error.message)"
}

# 4. Invalid password -> rejected
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/login' -Method Post -Body '{"email":"test@vync.dev","password":"wrongpass1"}' -ContentType 'application/json' | Out-Null
    Write-Host "4. Wrong password: unexpectedly accepted (BUG)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "4. Wrong password blocked with HTTP $status - code: $($err.error.code)"
}

# 5. Protected route without token -> rejected
try {
    Invoke-RestMethod -Uri 'http://localhost:5000/api/v1/auth/me' -Method Get | Out-Null
    Write-Host "5. /me without token: unexpectedly accepted (BUG)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $err = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "5. /me without token blocked with HTTP $status - code: $($err.error.code)"
}

Write-Host "ALL CHECKS DONE"
