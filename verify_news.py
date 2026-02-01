import urllib.request
import json
import ssl

API_KEY = "6376163a8aea44618e5a0ed725aec3b1"
URL = f"https://newsapi.org/v2/top-headlines?country=us&apiKey={API_KEY}"

try:
    print(f"Testing NewsAPI Key: {API_KEY}")
    # Create unverified context to avoid SSL certificate errors in some environments
    context = ssl._create_unverified_context()
    
    with urllib.request.urlopen(URL, context=context) as response:
        print(f"Status Code: {response.getcode()}")
        data = json.loads(response.read().decode('utf-8'))
        
        if response.getcode() == 200:
            print(f"Success! Found {data.get('totalResults', 0)} articles.")
            if data.get('articles'):
                print("First article title:", data['articles'][0]['title'])
        else:
            print(f"Error Response: {data}")
            
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Script Error: {e}")
