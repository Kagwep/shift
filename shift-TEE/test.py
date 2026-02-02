import requests
import json
from datetime import datetime

# AWS API endpoint only
API_URL = "https://o9r0ju4pg2.execute-api.eu-north-1.amazonaws.com/dev/lipo_volatility_predict"

def test_volatility_api(days=15):
    """
    Test the AWS volatility prediction API
    """
    print(f"\n{'='*60}")
    print(f"Testing AWS Volatility Prediction API")
    print(f"{'='*60}\n")
    
    # Prepare request
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "days": str(days)
    }
    
    print(f"📡 Request Details:")
    print(f"   URL: {API_URL}")
    print(f"   Method: POST")
    print(f"   Payload: {json.dumps(payload, indent=2)}")
    print(f"\n{'='*60}\n")
    
    try:
        # Make the request
        print("⏳ Sending request...")
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"✅ Response received!")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Time: {response.elapsed.total_seconds():.2f}s")
        print(f"\n{'='*60}\n")
        
        # Check if request was successful
        if response.status_code == 200:
            data = response.json()
            
            print("📊 Response Data:")
            print(json.dumps(data, indent=2))
            print(f"\n{'='*60}\n")
            
            return data
            
        else:
            print(f"❌ Error Response:")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response Text: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
        return None
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection error: {str(e)}")
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
        return None
        
    except json.JSONDecodeError:
        print("❌ Failed to parse JSON response")
        print(f"   Raw response: {response.text}")
        return None
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return None


def test_multiple_days():
    """
    Test the API with different day values
    """
    print("\n" + "="*60)
    print("Testing Multiple Day Values")
    print("="*60 + "\n")
    
    test_values = [5, 15, 30]
    results = {}
    
    for days in test_values:
        print(f"\n🔄 Testing with days={days}")
        print("-"*60)
        result = test_volatility_api(days)
        results[days] = result
        print("\n")
    
    return results


if __name__ == "__main__":
    print("\n" + "🚀 AWS Volatility API Tester" + "\n")
    print(f"Timestamp: {datetime.now().isoformat()}\n")
    
    # Test 1: Basic test with 15 days
    print("\n📋 Test 1: Basic API Test (15 days)")
    result = test_volatility_api(15)
    
    # Test 2: Multiple day values
    print("\n📋 Test 2: Multiple Day Values")
    multi_results = test_multiple_days()
    
    print("\n" + "="*60)
    print("✅ All tests completed!")
    print("="*60 + "\n")