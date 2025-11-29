#!/usr/bin/env python
"""
Local API testing script for CheckmateAI.
Tests all endpoints and displays input/output clearly.

Usage:
    1. Start the server: uvicorn app.main:app --reload
    2. Run this script: python scripts/test_local.py
"""

import httpx
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
TIMEOUT = 60.0


def print_separator():
    print("-" * 70)


def print_header(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def print_request(method: str, endpoint: str, body: dict = None):
    """Print the request details."""
    print(f"\n>>> REQUEST: {method} {endpoint}")
    if body:
        print(f"    Body: {json.dumps(body, indent=4)}")


def print_response(status_code: int, data):
    """Print the response details."""
    print(f"\n<<< RESPONSE: Status {status_code}")
    if data:
        formatted = json.dumps(data, indent=4, ensure_ascii=False)
        # Truncate very long responses
        if len(formatted) > 1500:
            formatted = formatted[:1500] + "\n    ... (truncated)"
        print(f"    {formatted}")


def print_result(success: bool, message: str = ""):
    status = "[PASS]" if success else "[FAIL]"
    color_msg = f"\n{status} {message}" if message else f"\n{status}"
    print(color_msg)
    print_separator()


def test_endpoint(method: str, endpoint: str, body: dict = None, expected_status: int = 200):
    """Test a single endpoint and display input/output."""
    url = f"{BASE_URL}{endpoint}"
    print_request(method, endpoint, body)
    
    try:
        if method == "GET":
            r = httpx.get(url, timeout=TIMEOUT)
        elif method == "POST":
            r = httpx.post(url, json=body, timeout=TIMEOUT)
        else:
            print(f"Unsupported method: {method}")
            return None, False
        
        try:
            data = r.json()
        except:
            data = r.text
        
        print_response(r.status_code, data)
        
        success = r.status_code == expected_status
        print_result(success, f"Expected status {expected_status}, got {r.status_code}")
        
        return data, success
        
    except httpx.TimeoutException:
        print("\n<<< RESPONSE: TIMEOUT")
        print_result(False, "Request timed out")
        return None, False
    except httpx.ConnectError:
        print("\n<<< RESPONSE: CONNECTION ERROR")
        print_result(False, "Could not connect to server")
        return None, False
    except Exception as e:
        print(f"\n<<< RESPONSE: ERROR - {str(e)}")
        print_result(False, str(e))
        return None, False


def main():
    print("\n" + "=" * 70)
    print(" CheckmateAI API Test Suite")
    print(f" Target: {BASE_URL}")
    print(f" Time: {datetime.now().isoformat()}")
    print("=" * 70)
    
    # Check if server is running
    try:
        r = httpx.get(f"{BASE_URL}/", timeout=5.0)
    except httpx.ConnectError:
        print("\n ERROR: Cannot connect to server!")
        print(f" Make sure the server is running at {BASE_URL}")
        print(" Start with: uvicorn app.main:app --reload")
        sys.exit(1)
    
    # ============================================================
    # 1. Health Endpoints
    # ============================================================
    print_header("1. Health Endpoints")
    
    # Test 1.1: Root endpoint
    test_endpoint("GET", "/")
    
    # Test 1.2: Health check
    test_endpoint("GET", "/health")
    
    # ============================================================
    # 2. Verification Endpoints
    # ============================================================
    print_header("2. Verification Endpoints")
    
    # Test 2.1: Verify a false claim
    test_endpoint("POST", "/api/verify", {
        "text": "Drinking bleach cures COVID-19",
        "language": "en"
    })
    
    # Test 2.2: Verify another claim
    test_endpoint("POST", "/api/verify", {
        "text": "5G towers cause cancer",
        "language": "en"
    })
    
    # Test 2.3: Verify with missing text (should fail validation)
    test_endpoint("POST", "/api/verify", {
        "language": "en"
    }, expected_status=422)
    
    # Test 2.4: Get verification history
    test_endpoint("GET", "/api/verify/history?limit=5")
    
    # Test 2.5: Get history with pagination
    test_endpoint("GET", "/api/verify/history?limit=2&offset=0")
    
    # ============================================================
    # 3. Threat Feed Endpoints
    # ============================================================
    print_header("3. Threat Feed Endpoints")
    
    # Test 3.1: Get feed
    test_endpoint("GET", "/api/feed?limit=5")
    
    # Test 3.2: Get high intensity threats
    test_endpoint("GET", "/api/feed/intensity/high?limit=3")
    
    # Test 3.3: Get medium intensity threats
    test_endpoint("GET", "/api/feed/intensity/medium?limit=3")
    
    # Test 3.4: Get low intensity threats
    test_endpoint("GET", "/api/feed/intensity/low?limit=3")
    
    # Test 3.5: Get trending topics
    test_endpoint("GET", "/api/feed/trending")
    
    # Test 3.6: Invalid intensity (should fail with 400)
    test_endpoint("GET", "/api/feed/intensity/invalid", expected_status=400)
    
    # ============================================================
    # 4. Vaccine Digest Endpoints
    # ============================================================
    print_header("4. Vaccine Digest Endpoints")
    
    # Test 4.1: Get latest vaccine digest (404 is expected if none exists)
    print("\nNote: 404 is expected if no vaccine digest exists yet")
    test_endpoint("GET", "/api/vaccine/latest", expected_status=404)
    
    # Test 4.2: Get vaccine archive
    test_endpoint("GET", "/api/vaccine/archive?limit=3")
    
    # ============================================================
    # Summary
    # ============================================================
    print_header("Test Suite Complete")
    print(" All endpoints have been tested.")
    print(" Review the results above for any failures.\n")


if __name__ == "__main__":
    main()
