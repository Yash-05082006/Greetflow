# Greetflow API Test Script (PowerShell)
# Make sure to set your environment variables before running

Write-Host "🧪 Testing Greetflow API..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if environment variables are set
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) {
    Write-Host "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set" -ForegroundColor Red
    Write-Host "Please create a .env file with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

$BASE_URL = "http://localhost:3000"

Write-Host "📡 Testing server health..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 Testing root endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/" -Method GET
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Root endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 Testing GET /api/people (should return empty array initially)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/people" -Method GET
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ GET people failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 Testing POST /api/people (create test person)..." -ForegroundColor Cyan
try {
    $body = @{
        first_name = "Test"
        last_name = "User"
        email = "test@example.com"
        dob = "1990-01-01"
        timezone = "UTC"
        consent_email = $true
        tags = @("test")
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/people" -Method POST -Body $body -ContentType "application/json"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ POST people failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 Testing GET /api/people (should now return the created person)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/people" -Method GET
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ GET people failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📡 Testing GET /api/people/upcoming (upcoming birthdays)..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/people/upcoming?days=30" -Method GET
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ GET upcoming failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ API tests completed!" -ForegroundColor Green
