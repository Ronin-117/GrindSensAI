import requests
import json
import time

# --- Configuration ---
BASE_URL = "http://127.0.0.1:8000/api" # Your Django API base URL

# --- Helper to print responses nicely ---
def print_response(response, context=""):
    print(f"\n--- {context} ---")
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.JSONDecodeError:
        print("Response Text:")
        print(response.text)
    print("-" * 30)

# --- API Interaction Functions ---

def signup_user(username, password, email=""):
    url = f"{BASE_URL}/register/"
    payload = {"username": username, "password": password}
    if email: payload["email"] = email
    response = requests.post(url, json=payload)
    print_response(response, f"SIGNUP User: {username}")
    return response

def login_user(username, password):
    url = f"{BASE_URL}/token/"
    payload = {"username": username, "password": password}
    response = requests.post(url, json=payload)
    print_response(response, f"LOGIN User: {username}")
    if response.status_code == 200:
        return response.json().get("access"), response.json().get("refresh")
    return None, None

def create_profile(access_token, age, bio="",height=0,weight=0):
    url = f"{BASE_URL}/profile/create/"
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"age": age, "bio": bio, "height": height, "weight": weight}
    response = requests.post(url, json=payload, headers=headers)
    print_response(response, f"CREATE Profile (Age: {age})")
    return response

def get_profile(access_token):
    url = f"{BASE_URL}/profile/" # Assumes GET to this retrieves the user's profile
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    print_response(response, "GET User Profile")
    return response

# --- Main Script Execution ---
if __name__ == "__main__":

    test_username = f"Ichigosan"
    test_password = "SubSoulReaper"
    test_email = f"ichigo@gmail.com"
    user_age_to_set = 30
    user_bio = f"Bio for {test_username} created via script."
    user_height = 50
    user_weight = 60

    # 1. Signup
    signup_response = signup_user(test_username, test_password, test_email)
    if signup_response.status_code not in [200, 201]:
        print("Signup failed. Exiting.")
        exit()
    # user_id = signup_response.json().get('id') # If your signup returns user details

    # 2. Login to get access token
    access_token, refresh_token = login_user(test_username, test_password)
    if not access_token:
        print("Login failed. Exiting.")
        exit()
    print(f"Access Token obtained: {access_token[:30]}...")

    # 3. Create UserProfile data (e.g., age)
    # First, try to get the profile. If using get_or_create in the view, this might create it.
    # For a dedicated create endpoint:
    print("\nAttempting to create profile...")
    create_profile_response = create_profile(access_token, user_age_to_set, user_bio,user_height,user_weight)

    if create_profile_response.status_code == 201: # 201 Created
        print("Profile created successfully.")
        profile_data_created = create_profile_response.json()
        print(f"Created Profile Age: {profile_data_created.get('age')}")
    elif create_profile_response.status_code == 400 and "already exists" in create_profile_response.text:
        print("Profile already exists for this user (perhaps from a previous run or get_or_create).")
    else:
        print("Failed to create profile or unexpected response.")


    # 4. Retrieve UserProfile data (which includes age) using the access token
    print("\nAttempting to retrieve profile...")
    get_profile_response = get_profile(access_token)

    if get_profile_response.status_code == 200:
        profile_data_retrieved = get_profile_response.json()
        retrieved_age = profile_data_retrieved.get('age')
        retrieved_username = profile_data_retrieved.get('username') # From serializer
        print(f"\nSuccessfully retrieved profile for user: {retrieved_username}")
        print(f"User's Age: {retrieved_age}")
        print(f"User's Bio: {profile_data_retrieved.get('bio')}")

        if retrieved_age == user_age_to_set:
            print(f"SUCCESS: Retrieved age ({retrieved_age}) matches the age set ({user_age_to_set}).")
        else:
            print(f"NOTICE: Retrieved age ({retrieved_age}) does not match the age we tried to set ({user_age_to_set}). This could be due to various reasons (e.g., profile existed, update logic, etc.).")
    else:
        print(f"Failed to retrieve profile. Status: {get_profile_response.status_code}")

    print("\n--- Script Finished ---")