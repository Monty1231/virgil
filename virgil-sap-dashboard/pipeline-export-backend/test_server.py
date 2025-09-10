#!/usr/bin/env python3
"""
Simple test script to verify the server can start
"""

import uvicorn
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_server():
    """Test if the server can start"""
    try:
        print("Testing server startup...")
        
        # Import the app
        from template_api import app
        print("✅ App imported successfully")
        
        # Test health endpoint
        from fastapi.testclient import TestClient
        client = TestClient(app)
        
        response = client.get("/health")
        print(f"✅ Health endpoint response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test templates endpoint (should work without DB)
        response = client.get("/templates")
        print(f"✅ Templates endpoint response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        print("✅ All tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_server()
    sys.exit(0 if success else 1) 