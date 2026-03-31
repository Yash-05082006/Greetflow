#!/bin/bash

# Greetflow API Test Script
# Make sure to set your environment variables before running

echo "🧪 Testing Greetflow API..."
echo "================================"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

BASE_URL="http://localhost:3000"

echo "📡 Testing server health..."
curl -s -X GET "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"

echo ""
echo "📡 Testing root endpoint..."
curl -s -X GET "$BASE_URL/" | jq '.' || echo "❌ Root endpoint failed"

echo ""
echo "📡 Testing GET /api/people (should return empty array initially)..."
curl -s -X GET "$BASE_URL/api/people" | jq '.' || echo "❌ GET people failed"

echo ""
echo "📡 Testing POST /api/people (create test person)..."
curl -s -X POST "$BASE_URL/api/people" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "dob": "1990-01-01",
    "timezone": "UTC",
    "consent_email": true,
    "tags": ["test"]
  }' | jq '.' || echo "❌ POST people failed"

echo ""
echo "📡 Testing GET /api/people (should now return the created person)..."
curl -s -X GET "$BASE_URL/api/people" | jq '.' || echo "❌ GET people failed"

echo ""
echo "📡 Testing GET /api/people/upcoming (upcoming birthdays)..."
curl -s -X GET "$BASE_URL/api/people/upcoming?days=30" | jq '.' || echo "❌ GET upcoming failed"

echo ""
echo "✅ API tests completed!"
