import urllib.request
import urllib.error
import json

def test_login(email, password, expected_status):
    url = "http://localhost:8000/api/v1/auth/login"
    data = json.dumps({"email": email, "password": password}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = json.loads(response.read().decode())
            print(f"Login test for {email} / {password}:")
            print(f"  HTTP Status: {status}")
            print(f"  Success response: {body.get('success')}")
            if status == 200:
                data_node = body.get("data", {})
                print(f"  Access Token present: {'access_token' in data_node}")
                print(f"  Refresh Token present: {'refresh_token' in data_node}")
                print(f"  Token Type: {data_node.get('token_type')}")
                print(f"  Expires In: {data_node.get('expires_in')}")
                print(f"  User ID present: {'id' in data_node.get('user', {})}")
                print(f"  User Email: {data_node.get('user', {}).get('email')}")
            
            if status != expected_status:
                print(f"[ERROR] Expected status {expected_status}, got {status}")
                return False
            return True
    except urllib.error.HTTPError as e:
        status = e.code
        body = json.loads(e.read().decode())
        print(f"Login test for {email} / {password}:")
        print(f"  HTTP Status: {status} (Expected: {expected_status})")
        print(f"  Error body: {body}")
        if status != expected_status:
            print(f"[ERROR] Expected status {expected_status}, got {status}")
            return False
        return True

def run_tests():
    print("Starting API login authentication tests...")
    
    # Test 1: Valid Login
    print("\n--- Test 1: Valid Credentials ---")
    t1 = test_login("admin@netshield.io", "Admin@123", 200)
    
    # Test 2: Invalid Login
    print("\n--- Test 2: Invalid Password ---")
    t2 = test_login("admin@netshield.io", "WrongPassword123", 401)
    
    if t1 and t2:
        print("\nAll login API tests PASSED successfully!")
    else:
        print("\n[FAILURE] Some login API tests FAILED!")

if __name__ == "__main__":
    run_tests()
