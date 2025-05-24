import requests
import json
import time # To make usernames unique for multiple runs

# --- Configuration ---
BASE_URL = "http://127.0.0.1:8000/api" # Your Django API base URL

# --- Helper to print responses nicely ---
def print_response(response):
    print(f"\nStatus Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.JSONDecodeError:
        print("Response Text:")
        print(response.text)
    print("-" * 30)

# --- API Interaction Functions ---

def signup_user(username, password, email=""):
    """Signs up a new user."""
    url = f"{BASE_URL}/register/"
    payload = {
        "username": username,
        "password": password,
    }
    if email:
        payload["email"] = email

    print(f"Attempting to SIGNUP user: {username}")
    response = requests.post(url, json=payload)
    print_response(response)
    return response

def login_user(username, password):
    """Logs in a user and returns access and refresh tokens."""
    url = f"{BASE_URL}/token/" # simplejwt's default token obtain endpoint
    payload = {
        "username": username,
        "password": password,
    }
    print(f"Attempting to LOGIN user: {username}")
    response = requests.post(url, json=payload)
    print_response(response)
    if response.status_code == 200:
        return response.json().get("access"), response.json().get("refresh")
    return None, None


# --- Main Script Execution ---
if __name__ == "__main__":

    test_username = f"notNeil"
    test_password = "loveu3000"
    test_email= "notneil@gmail.com"

    # # 1. Signup
    # signup_response = signup_user(test_username, test_password, test_email)
    # if signup_response.status_code not in [200, 201]: # 201 Created is typical
    #     print("Signup failed. Exiting.")
    #     exit()

    # 2. Login
    access_token, refresh_token = login_user(test_username, test_password)
    if not access_token:
        print("Login failed. Exiting.")
        exit()
    print(f"Received Access Token: {access_token[:30]}...") # Print a snippet
    print(f"Received Refresh Token: {refresh_token[:30]}...")
