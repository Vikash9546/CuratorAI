import os
import json
from endee import Endee, Precision
import requests

NDD_URL = "http://127.0.0.1:8080/api/v1"
INDEX_NAME = "knowledge_base"
DIMENSION = 384

def test():
    print(f"Testing connectivity to {NDD_URL}...")
    
    # Test with requests directly
    try:
        r = requests.get(f"{NDD_URL}/api/v1/index/{INDEX_NAME}/info")
        print(f"Requests GET status: {r.status_code}")
        print(f"Requests GET body: {r.text}")
        print(f"Requests GET JSON: {r.json()}")
    except Exception as e:
        print(f"Requests error: {e}")

    # Test with Endee client
    try:
        client = Endee()
        client.set_base_url(NDD_URL)
        print("Set base URL.")
        idx = client.get_index(name=INDEX_NAME)
        print(f"Client get_index: {idx}")
        info = idx.info()
        print(f"Index info: {info}")
    except Exception as e:
        print(f"Client error: {e}")

if __name__ == "__main__":
    test()
