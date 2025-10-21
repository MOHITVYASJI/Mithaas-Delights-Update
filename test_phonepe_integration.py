#!/usr/bin/env python3
"""
PhonePe Integration Test Script
Tests the PhonePe payment gateway integration
"""

import os
import sys
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, '/app/backend')

# Set environment variables
os.environ['PHONEPE_MERCHANT_ID'] = 'M2342TSKAY3F6'
os.environ['PHONEPE_CLIENT_ID'] = 'SU2510151220226699332876'
os.environ['PHONEPE_CLIENT_SECRET'] = '257ff7ad-2d3d-4a9f-b388-79cb807a7b96'
os.environ['PHONEPE_CLIENT_VERSION'] = '1'
os.environ['PHONEPE_SALT_KEY'] = '257ff7ad-2d3d-4a9f-b388-79cb807a7b96'
os.environ['PHONEPE_SALT_INDEX'] = '1'
os.environ['PHONEPE_ENVIRONMENT'] = 'PRODUCTION'

from phonepe_utils import get_phonepe_client

def test_client_initialization():
    """Test 1: PhonePe Client Initialization"""
    print("\n" + "="*60)
    print("TEST 1: PhonePe Client Initialization")
    print("="*60)
    
    try:
        client = get_phonepe_client()
        print("✅ PhonePe Client initialized successfully")
        print(f"   Environment: {client.environment}")
        print(f"   Base URL: {client.base_url}")
        print(f"   Auth URL: {client.auth_url}")
        print(f"   Merchant ID: {client.merchant_id}")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize client: {str(e)}")
        return False

def test_authorization_token():
    """Test 2: OAuth Token Generation"""
    print("\n" + "="*60)
    print("TEST 2: OAuth Authorization Token")
    print("="*60)
    
    try:
        client = get_phonepe_client()
        print("⏳ Requesting authorization token from PhonePe...")
        
        token = client.get_authorization_token()
        
        if token:
            print("✅ Authorization token obtained successfully")
            print(f"   Token: {token[:20]}...{token[-20:]}")
            return True
        else:
            print("❌ No token received")
            return False
            
    except Exception as e:
        print(f"❌ Failed to get authorization token: {str(e)}")
        return False

def test_checksum_generation():
    """Test 3: Checksum Generation"""
    print("\n" + "="*60)
    print("TEST 3: Checksum Generation")
    print("="*60)
    
    try:
        client = get_phonepe_client()
        
        # Test payload
        test_payload = {
            "merchantId": "M2342TSKAY3F6",
            "merchantOrderId": "TEST_ORDER_123",
            "amount": 50000,
            "currency": "INR"
        }
        
        endpoint = "/v1/pay"
        
        print(f"⏳ Generating checksum for test payload...")
        checksum = client.generate_checksum(test_payload, endpoint)
        
        print("✅ Checksum generated successfully")
        print(f"   Checksum: {checksum}")
        print(f"   Format: {'###' in checksum and '✅ Correct' or '❌ Incorrect'}")
        
        # Verify format
        parts = checksum.split('###')
        if len(parts) == 2:
            print(f"   Hash: {parts[0][:20]}...")
            print(f"   Salt Index: {parts[1]}")
            return True
        else:
            print("❌ Checksum format incorrect")
            return False
            
    except Exception as e:
        print(f"❌ Failed to generate checksum: {str(e)}")
        return False

def test_payment_order_creation():
    """Test 4: Payment Order Creation (Dry Run - No actual payment)"""
    print("\n" + "="*60)
    print("TEST 4: Payment Order Creation")
    print("="*60)
    
    try:
        client = get_phonepe_client()
        
        # Test order data
        merchant_order_id = f"TEST_ORDER_{int(datetime.now().timestamp())}"
        amount = 10.0  # ₹10 for testing
        redirect_url = "https://mithaas-delights.vercel.app/payment-status"
        
        print(f"⏳ Creating test payment order...")
        print(f"   Order ID: {merchant_order_id}")
        print(f"   Amount: ₹{amount}")
        print(f"   Redirect: {redirect_url}")
        
        # Note: This will make a real API call to PhonePe
        # The order will be created but not paid
        response = client.create_payment_order(
            merchant_order_id=merchant_order_id,
            amount=amount,
            redirect_url=redirect_url,
            customer_phone="+919876543210",
            customer_email="test@example.com"
        )
        
        print("\n✅ Payment order created successfully!")
        print(f"   Response: {json.dumps(response, indent=2)}")
        
        if response.get('success'):
            payment_url = response.get('data', {}).get('instrumentResponse', {}).get('redirectInfo', {}).get('url')
            if payment_url:
                print(f"\n   🔗 Payment URL: {payment_url}")
                print(f"\n   Note: This is a REAL payment URL. You can test by opening it in browser.")
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Failed to create payment order: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🔬 PHONEPE INTEGRATION TEST SUITE")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Test 1: Client Initialization
    results.append(("Client Initialization", test_client_initialization()))
    
    # Test 2: Authorization Token
    results.append(("Authorization Token", test_authorization_token()))
    
    # Test 3: Checksum Generation
    results.append(("Checksum Generation", test_checksum_generation()))
    
    # Test 4: Payment Order Creation (Optional - makes real API call)
    print("\n" + "="*60)
    print("WARNING: Test 4 will create a REAL payment order on PhonePe")
    print("="*60)
    user_input = input("Do you want to proceed with Test 4? (yes/no): ").strip().lower()
    
    if user_input in ['yes', 'y']:
        results.append(("Payment Order Creation", test_payment_order_creation()))
    else:
        print("⏭️  Skipping Test 4")
        results.append(("Payment Order Creation", None))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    for test_name, result in results:
        if result is True:
            status = "✅ PASSED"
        elif result is False:
            status = "❌ FAILED"
        else:
            status = "⏭️  SKIPPED"
        print(f"{test_name:<30} {status}")
    
    passed = sum(1 for _, r in results if r is True)
    failed = sum(1 for _, r in results if r is False)
    skipped = sum(1 for _, r in results if r is None)
    
    print("\n" + "="*60)
    print(f"Total Tests: {len(results)} | Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    print("="*60)
    
    if failed == 0:
        print("\n🎉 All tests passed! PhonePe integration is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
    
    print("\n")

if __name__ == "__main__":
    main()
