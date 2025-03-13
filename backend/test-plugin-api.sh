#!/bin/bash

# Test the plugin API without authentication
echo "Testing without authentication..."
curl -s -X GET http://localhost:5000/api/plugins -H "Content-Type: application/json" | json_pp

echo -e "\n\n---------------------------------------\n\n"

# Test with invalid authentication token
echo "Testing with invalid authentication token..."
curl -s -X GET http://localhost:5000/api/plugins -H "Content-Type: application/json" -H "x-auth-token: invalid-token" | json_pp

echo -e "\n\n---------------------------------------\n\n"

# First, login to get a valid token
echo "Logging in to get a valid token..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token received: ${TOKEN:0:15}..."

echo -e "\n\n---------------------------------------\n\n"

# Test with valid authentication token
echo "Testing with valid authentication token..."
curl -s -X GET http://localhost:5000/api/plugins -H "Content-Type: application/json" -H "x-auth-token: $TOKEN" | json_pp 