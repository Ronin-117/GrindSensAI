import requests
import json
import time

# --- Configuration ---
BASE_URL = "http://127.0.0.1:8000/api"

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

# ... (signup_user, login_user functions remain the same) ...
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

def create_training_routine(access_token, routine_data):
    url = f"{BASE_URL}/routines/"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(url, json=routine_data, headers=headers)
    print_response(response, f"CREATE Training Routine: {routine_data.get('routine_name', 'N/A')}")
    return response

def get_training_routines(access_token):
    url = f"{BASE_URL}/routines/"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    print_response(response, "GET User's Training Routines")
    return response

def get_specific_routine(access_token, routine_db_id):
    url = f"{BASE_URL}/routines/{routine_db_id}/"
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(url, headers=headers)
    print_response(response, f"GET Specific Routine ID: {routine_db_id}")
    return response


# --- Main Script Execution ---
if __name__ == "__main__":
    user1_username = "stark"
    user1_password = "YzXFg49xE3ApzK3"
    user2_username = f"Steve"
    user2_password = "PasswordUser2!"

    # --- User 1 Operations ---
    print("===== USER 1 OPERATIONS =====")
    #signup_user(user1_username, user1_password)
    user1_access_token, _ = login_user(user1_username, user1_password)

    if user1_access_token:
        # Sample routine data for User 1
        user1_routine_data = {
            "routine_id": f"BFB001", # Make routine_id unique for testing
            "routine_name": "Beginner Full Body Strength - Tony test",
            "goal": "Build foundational strength and muscle, learn basic movements.",
            "experience_level": "Beginner",
            "training_split": "Full Body",
            "days_per_week": "2-3 (with at least one rest day in between)",
            "description": "A simple full-body routine for User 1.",
            "weekly_schedule": [
                {
                    "day_of_week_or_number": "Workout Day 1",
                    "session_focus": "Full Body Strength A",
                    "exercises": [
                        {
                            "exercise_name": "Bodyweight Squats",
                            "target_muscles": ["Quadriceps", "Glutes", "Hamstrings", "Core"],
                            "sets": "2-3",
                            "reps_or_duration": "8-12 reps",
                            "rest_period": "60-90 seconds",
                            "notes": "Focus on form."
                        },
                        {
                            "exercise_name": "Push-ups",
                            "target_muscles": ["Chest", "Shoulders", "Triceps"],
                            "sets": "2-3",
                            "reps_or_duration": "AMRAP",
                            "rest_period": "60-90 seconds"
                        }
                    ]
                }
            ],
            "coach_response": "Looks like a good start for User 1!"
        }
        create_routine_response = create_training_routine(user1_access_token, user1_routine_data)
        if create_routine_response.status_code == 201:
            user1_created_routine_id = create_routine_response.json().get('id') # DB id
            get_specific_routine(user1_access_token, user1_created_routine_id)


        print("\n--- Getting User 1's routines ---")
        get_training_routines(user1_access_token)
    else:
        print(f"Failed to log in User 1 ({user1_username})")


    # # --- User 2 Operations (to show data isolation) ---
    # print("\n\n===== USER 2 OPERATIONS =====")
    # signup_user(user2_username, user2_password)
    # user2_access_token, _ = login_user(user2_username, user2_password)

    # if user2_access_token:
    #     user2_routine_data = {
    #         "routine_id": f"UL002", # Make routine_id unique for testing
    #         "routine_name": "Upper/Lower Split - User 2",
    #         "goal": "Increase strength and hypertrophy.",
    #         "experience_level": "Intermediate",
    #         "training_split": "Upper/Lower",
    #         "days_per_week": "4",
    #         "description": "An upper/lower split routine for User 2.",
    #         "weekly_schedule": [
    #             {
    #                 "day_of_week_or_number": "Upper Body Day 1",
    #                 "session_focus": "Strength & Hypertrophy",
    #                 "exercises": [
    #                     {
    #                         "exercise_name": "Bench Press",
    #                         "target_muscles": ["Chest", "Shoulders", "Triceps"],
    #                         "sets": "3-4",
    #                         "reps_or_duration": "6-10 reps",
    #                         "rest_period": "90-120 seconds"
    #                     }
    #                 ]
    #             }
    #         ],
    #         "coach_response": "Solid plan for User 2."
    #     }
    #     create_training_routine(user2_access_token, user2_routine_data)

    #     print("\n--- Getting User 2's routines (should NOT see User 1's routines) ---")
    #     get_training_routines(user2_access_token)
    # else:
    #     print(f"Failed to log in User 2 ({user2_username})")


    # --- Attempt for User 1 to get User 2's routines (should not work if User 2 created one) ---
    # This part is harder to test directly without knowing User 2's routine DB ID and if permissions are strict.
    # But the get_training_routines for user1_access_token should already demonstrate it only gets User 1's.

    print("\n--- Script Finished ---")