import requests
import sys
import json
from datetime import datetime

class BeautyInstituteAPITester:
    def __init__(self, base_url="https://institut-lea.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_get_prices(self):
        """Test getting public prices"""
        success, response = self.run_test(
            "Get Public Prices",
            "GET",
            "prices",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} prices")
            if len(response) > 0:
                print(f"   Sample price: {response[0].get('name', 'N/A')} - {response[0].get('priceEur', 'N/A')}€")
        return success, response

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"password": "LEAadmin369"}
        )
        if success and response.get('success'):
            self.admin_token = response.get('token')
            print(f"   Admin token obtained")
        return success

    def test_admin_get_all_prices(self):
        """Test admin get all prices"""
        if not self.admin_token:
            print("❌ Skipping - No admin token")
            return False
        
        success, response = self.run_test(
            "Admin Get All Prices",
            "GET",
            "prices/all",
            200,
            headers={"Authorization": self.admin_token}
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} total prices (including inactive)")
        return success, response

    def test_admin_create_price(self):
        """Test admin create new price"""
        if not self.admin_token:
            print("❌ Skipping - No admin token")
            return False, None
        
        new_price = {
            "category": "Test Category",
            "name": "Test Service",
            "priceEur": 25.0,
            "durationMin": 30,
            "note": "Test note",
            "isActive": True,
            "sortOrder": 999
        }
        
        success, response = self.run_test(
            "Admin Create Price",
            "POST",
            "prices",
            200,
            data=new_price,
            headers={"Authorization": self.admin_token}
        )
        if success:
            print(f"   Created price with ID: {response.get('id')}")
        return success, response

    def test_admin_update_price(self, price_id):
        """Test admin update price"""
        if not self.admin_token or not price_id:
            print("❌ Skipping - No admin token or price ID")
            return False
        
        update_data = {
            "priceEur": 30.0,
            "note": "Updated test note"
        }
        
        success, response = self.run_test(
            "Admin Update Price",
            "PUT",
            f"prices/{price_id}",
            200,
            data=update_data,
            headers={"Authorization": self.admin_token}
        )
        return success

    def test_admin_delete_price(self, price_id):
        """Test admin delete price"""
        if not self.admin_token or not price_id:
            print("❌ Skipping - No admin token or price ID")
            return False
        
        success, response = self.run_test(
            "Admin Delete Price",
            "DELETE",
            f"prices/{price_id}",
            200,
            headers={"Authorization": self.admin_token}
        )
        return success

    def test_gift_card_create_checkout(self):
        """Test gift card checkout creation"""
        success, response = self.run_test(
            "Gift Card Create Checkout",
            "POST",
            "gift-cards/create-checkout",
            200,
            data={
                "amount": 30.0,
                "origin_url": self.base_url
            }
        )
        if success:
            print(f"   Checkout URL created: {response.get('url', 'N/A')[:50]}...")
            return success, response.get('session_id')
        return success, None

    def test_gift_card_status(self, session_id):
        """Test gift card status check"""
        if not session_id:
            print("❌ Skipping - No session ID")
            return False
        
        success, response = self.run_test(
            "Gift Card Status Check",
            "GET",
            f"gift-cards/status/{session_id}",
            200
        )
        if success:
            print(f"   Payment status: {response.get('payment_status', 'N/A')}")
        return success

    def test_gift_card_verify(self):
        """Test gift card verification with dummy code"""
        success, response = self.run_test(
            "Gift Card Verify (dummy code)",
            "GET",
            "gift-cards/verify/LB-TEST-CODE",
            200
        )
        if success:
            print(f"   Found: {response.get('found', False)}")
        return success

    def test_unauthorized_admin_access(self):
        """Test unauthorized admin access"""
        success, response = self.run_test(
            "Unauthorized Admin Access",
            "GET",
            "prices/all",
            401
        )
        return success

    def test_invalid_admin_login(self):
        """Test invalid admin login"""
        success, response = self.run_test(
            "Invalid Admin Login",
            "POST",
            "admin/login",
            401,
            data={"password": "wrongpassword"}
        )
        return success

def main():
    print("🧪 Starting Beauty Institute API Tests")
    print("=" * 50)
    
    tester = BeautyInstituteAPITester()
    
    # Basic API tests
    tester.test_root_endpoint()
    
    # Public prices test
    prices_success, prices_data = tester.test_get_prices()
    
    # Admin authentication tests
    tester.test_invalid_admin_login()
    tester.test_unauthorized_admin_access()
    admin_login_success = tester.test_admin_login()
    
    # Admin CRUD tests
    created_price_id = None
    if admin_login_success:
        all_prices_success, all_prices_data = tester.test_admin_get_all_prices()
        create_success, created_price = tester.test_admin_create_price()
        if create_success and created_price:
            created_price_id = created_price.get('id')
            tester.test_admin_update_price(created_price_id)
            tester.test_admin_delete_price(created_price_id)
    
    # Gift card tests
    checkout_success, session_id = tester.test_gift_card_create_checkout()
    if checkout_success and session_id:
        tester.test_gift_card_status(session_id)
    tester.test_gift_card_verify()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"     Error: {failure['error']}")
            else:
                print(f"     Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    # Check if we have the expected number of seeded prices
    if prices_success and prices_data:
        if len(prices_data) >= 80:  # Should have around 88 prices
            print(f"\n✅ Database seeding successful: {len(prices_data)} prices found")
        else:
            print(f"\n⚠️  Expected ~88 prices, found {len(prices_data)}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())