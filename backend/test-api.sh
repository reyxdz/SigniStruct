#!/bin/bash
# Quick diagnostic test

echo "Testing backend API endpoints..."
echo ""

# Test health endpoint
echo "1. Testing health check:"
curl http://localhost:5000/api/health

echo ""
echo ""

# Test getting documents (need valid token)
echo "2. Testing if backend is responding (this will fail without auth token):"
curl -X GET http://localhost:5000/api/documents

echo ""
echo ""
echo "Check your terminal where backend is running for the debug logs!"
