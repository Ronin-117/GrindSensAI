# external_preset_seeder.py
import requests
import json

# --- Configuration ---
BASE_API_URL = "http://127.0.0.1:8000/api"  # Your Django API base URL
ROUTINES_ENDPOINT = f"{BASE_API_URL}/routines/"
# THIS IS A SECRET KEY - DO NOT HARDCODE IN PRODUCTION CLIENTS.
# For a script like this run in a trusted environment, it's okay for demonstration.
# In a real scenario, get this from an environment variable or secure config.
ADMIN_PRESET_KEY = "YOUR_SECRET_KEY"

# --- Helper to print responses nicely ---
def print_response(response, context=""):
    print(f"\n--- {context} ---")
    print(f"URL: {response.url}")
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except requests.exceptions.JSONDecodeError:
        print("Response Text:")
        print(response.text)
    print("-" * 30)


PRESET_ROUTINES_DATA = [
    {
      "routine_id": "BFS-101",
      "routine_name": "Beginner Full Body Strength",
      "goal": "Build foundational strength and muscle, improve overall fitness.",
      "experience_level": "Beginner",
      "training_split": "Full Body",
      "days_per_week": "3",
      "description": "This routine is designed for beginners to build a solid foundation of strength and muscle. It focuses on compound exercises that work multiple muscle groups simultaneously, promoting efficient and balanced development.",
      "is_preset": True,
      "weekly_schedule": [
        {
          "day_of_week_or_number": "Day 1",
          "session_focus": "Full Body Strength",
          "exercises": [
            {
              "exercise_name": "Bodyweight Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on proper form. Keep your back straight and chest up."
            },
            {
              "exercise_name": "Push-Ups (on knees if needed)",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight line from head to knees or toes."
            },
            {
              "exercise_name": "Dumbbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per arm",
              "rest_period": "60 seconds",
              "notes": "Use a light to moderate weight. Keep your back straight and pull the weight towards your chest."
            },
            {
              "exercise_name": "Plank",
              "target_muscles": ["Core"],
              "sets": "3",
              "reps_or_duration": "Hold for 30-60 seconds",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight line from head to heels. Engage your core."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 2",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 3",
          "session_focus": "Full Body Strength",
          "exercises": [
            {
              "exercise_name": "Bodyweight Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on proper form. Keep your back straight and chest up."
            },
            {
              "exercise_name": "Incline Push-Ups",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "60 seconds",
              "notes": "Use a elevated surface such as a bench or wall to make easier."
            },
            {
              "exercise_name": "Dumbbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per arm",
              "rest_period": "60 seconds",
              "notes": "Use a light to moderate weight. Keep your back straight and pull the weight towards your chest."
            },
            {
              "exercise_name": "Glute Bridges",
              "target_muscles": ["Glutes", "Hamstrings"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "60 seconds",
              "notes": "Squeeze your glutes at the top of the movement."
            },
            {
              "exercise_name": "Side Plank",
              "target_muscles": ["Core", "Obliques"],
              "sets": "3",
              "reps_or_duration": "Hold for 30-60 seconds per side",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight line from head to feet."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 4",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 5",
          "session_focus": "Full Body Strength",
          "exercises": [
            {
              "exercise_name": "Bodyweight Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on proper form. Keep your back straight and chest up."
            },
            {
              "exercise_name": "Push-Ups (on knees if needed)",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight line from head to knees or toes."
            },
            {
              "exercise_name": "Dumbbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per arm",
              "rest_period": "60 seconds",
              "notes": "Use a light to moderate weight. Keep your back straight and pull the weight towards your chest."
            },
            {
              "exercise_name": "Walking Lunges",
              "target_muscles": ["Quads", "Glutes", "Hamstrings"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per leg",
              "rest_period": "60 seconds",
              "notes": "Keep your front knee behind your toes."
            },
            {
              "exercise_name": "Superman",
              "target_muscles": ["Lower Back"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60 seconds",
              "notes": "Engage your core and lift your arms and legs off the ground simultaneously."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 6",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 7",
          "session_focus": "Rest",
          "exercises": []
        }
      ],
      "cardio_guidelines": "Incorporate 20-30 minutes of light cardio, such as walking, jogging, or cycling, on your rest days.",
      "flexibility_guidelines": "Perform static stretches after each workout, holding each stretch for 20-30 seconds. Focus on major muscle groups such as quads, hamstrings, chest, and back. You can also incorporate dynamic stretching into your warm-up.",
      "precautions": "Consult with your doctor before starting any new exercise program. If you experience any pain, stop the exercise and consult with a healthcare professional. Proper form is crucial to prevent injuries. Start with lighter weights or modifications if needed, and gradually increase the intensity as you get stronger.",
      "Coach_response": "This is a great routine for beginners. The compound exercises target multiple muscle groups efficiently, promoting balanced strength development. The inclusion of bodyweight exercises makes it accessible without requiring a lot of equipment. Remember to focus on proper form and listen to your body."
    },
    {
      "routine_id": "IULS1",
      "routine_name": "Intermediate Upper/Lower Split",
      "goal": "Increase strength and muscle mass with a focus on balanced development.",
      "experience_level": "Intermediate",
      "training_split": "Upper/Lower",
      "days_per_week": "4",
      "description": "This upper/lower split routine is designed for individuals with some weightlifting experience. It focuses on building strength and hypertrophy through a balanced approach, hitting each muscle group twice per week.",
      "is_preset": True,
      "weekly_schedule": [
        {
          "day_of_week_or_number": "Day 1",
          "session_focus": "Upper Body Strength",
          "exercises": [
            {
              "exercise_name": "Bench Press",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3-4",
              "reps_or_duration": "6-8 reps",
              "rest_period": "90-120 seconds",
              "notes": "Focus on controlled movement and full range of motion."
            },
            {
              "exercise_name": "Barbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3-4",
              "reps_or_duration": "6-8 reps",
              "rest_period": "90-120 seconds",
              "notes": "Maintain a flat back and pull with your elbows."
            },
            {
              "exercise_name": "Overhead Press",
              "target_muscles": ["Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "Control the weight during both the lifting and lowering phases."
            },
            {
              "exercise_name": "Pull-ups (or Lat Pulldowns)",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP) / 8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "If you cannot perform pull-ups, use lat pulldowns."
            },
            {
              "exercise_name": "Dumbbell Lateral Raises",
              "target_muscles": ["Shoulders"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "60 seconds",
              "notes": "Use a lighter weight and focus on proper form."
            },
            {
              "exercise_name": "Triceps Pushdowns",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "60 seconds",
              "notes": "Keep your elbows close to your body."
            },
                    {
              "exercise_name": "Barbell Curls",
              "target_muscles": ["Biceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60 seconds",
              "notes": "Maintain a slight bend in your knees and avoid swinging the weight."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 2",
          "session_focus": "Lower Body Strength",
          "exercises": [
            {
              "exercise_name": "Barbell Squats",
              "target_muscles": ["Quads", "Glutes", "Hamstrings"],
              "sets": "3-4",
              "reps_or_duration": "6-8 reps",
              "rest_period": "90-120 seconds",
              "notes": "Maintain a straight back and keep your core engaged."
            },
            {
              "exercise_name": "Deadlifts",
              "target_muscles": ["Hamstrings", "Glutes", "Back"],
              "sets": "1-2",
              "reps_or_duration": "3-5 reps",
              "rest_period": "120-180 seconds",
              "notes": "Focus on proper form to avoid injury. Consider doing Romanian Deadlifts on Day 4 as an alternative."
            },
            {
              "exercise_name": "Leg Press",
              "target_muscles": ["Quads", "Glutes", "Hamstrings"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "Use a controlled movement and full range of motion."
            },
            {
              "exercise_name": "Hamstring Curls",
              "target_muscles": ["Hamstrings"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on squeezing your hamstrings at the top of the movement."
            },
            {
              "exercise_name": "Calf Raises",
              "target_muscles": ["Calves"],
              "sets": "3-4",
              "reps_or_duration": "15-20 reps",
              "rest_period": "45-60 seconds",
              "notes": "Perform on a calf raise machine or with dumbbells."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 3",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 4",
          "session_focus": "Upper Body Hypertrophy",
          "exercises": [
            {
              "exercise_name": "Incline Dumbbell Press",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "Focus on squeezing your chest muscles at the top of the movement."
            },
            {
              "exercise_name": "Seated Cable Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60-90 seconds",
              "notes": "Maintain a straight back and pull with your elbows."
            },
            {
              "exercise_name": "Dumbbell Shoulder Press",
              "target_muscles": ["Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "Control the weight during both the lifting and lowering phases."
            },
            {
              "exercise_name": "Close-Grip Lat Pulldowns",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60-90 seconds",
              "notes": "Focus on squeezing your back muscles."
            },
            {
              "exercise_name": "Dumbbell Front Raises",
              "target_muscles": ["Shoulders"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "60 seconds",
              "notes": "Use a lighter weight and focus on proper form."
            },
            {
              "exercise_name": "Overhead Triceps Extensions",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60 seconds",
              "notes": "Keep your elbows close to your head."
            },
            {
              "exercise_name": "Hammer Curls",
              "target_muscles": ["Biceps", "Forearms"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60 seconds",
              "notes": "Maintain a neutral grip throughout the movement."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 5",
          "session_focus": "Lower Body Hypertrophy",
          "exercises": [
            {
              "exercise_name": "Front Squats",
              "target_muscles": ["Quads", "Glutes", "Hamstrings"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-90 seconds",
              "notes": "Maintain a straight back and keep your core engaged."
            },
            {
              "exercise_name": "Romanian Deadlifts",
              "target_muscles": ["Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60-90 seconds",
              "notes": "Keep your back straight and focus on pushing your hips back."
            },
            {
              "exercise_name": "Bulgarian Split Squats",
              "target_muscles": ["Quads", "Glutes", "Hamstrings"],
              "sets": "3",
              "reps_or_duration": "8-12 reps per leg",
              "rest_period": "60-90 seconds",
              "notes": "Use a controlled movement and full range of motion."
            },
            {
              "exercise_name": "Leg Extensions",
              "target_muscles": ["Quads"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on squeezing your quads at the top of the movement."
            },
            {
              "exercise_name": "Seated Calf Raises",
              "target_muscles": ["Calves"],
              "sets": "3-4",
              "reps_or_duration": "15-20 reps",
              "rest_period": "45-60 seconds",
              "notes": "Focus on a full range of motion."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 6",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 7",
          "session_focus": "Rest",
          "exercises": []
        }
      ],
      "cardio_guidelines": "Incorporate 20-30 minutes of moderate-intensity cardio 2-3 times per week on rest days. Examples include jogging, cycling, or swimming.",    
      "flexibility_guidelines": "Perform static stretching after each workout, holding each stretch for 20-30 seconds. Focus on major muscle groups.",
      "precautions": "Ensure proper form during all exercises to prevent injuries. Warm-up before each workout and cool down afterward. Adjust weight as needed to maintain proper form. If you are new to any of these exercises, consider consulting with a qualified fitness professional.",
      "Coach_response": "This Intermediate Upper/Lower Split routine is well-structured and suitable for your experience level. It effectively targets all major muscle groups twice per week, promoting both strength and hypertrophy. The inclusion of compound exercises like squats, deadlifts, bench press, and rows is excellent for building overall strength. Remember to prioritize proper form over weight to prevent injuries, and gradually increase the weight as you get stronger. Consistency is key, so stick to the schedule and listen to your body. If you feel any pain, stop the exercise and consult with a healthcare professional. Good luck!"
    },
    {
      "routine_id": "PPL-INT-001",
      "routine_name": "Intermediate Push/Pull/Legs",
      "goal": "Build strength, muscle mass, and improve overall fitness using a PPL split.",
      "experience_level": "Intermediate",
      "training_split": "Push/Pull/Legs",
      "days_per_week": "6",
      "description": "This intermediate Push/Pull/Legs (PPL) routine is designed for individuals with some weightlifting experience. It involves training specific muscle groups on different days, allowing for adequate rest and recovery. This split helps maximize muscle growth and strength gains.",
      "is_preset": True,
      "weekly_schedule": [
        {
          "day_of_week_or_number": "Day 1",
          "session_focus": "Push (Chest, Shoulders, Triceps)",
          "exercises": [
            {
              "exercise_name": "Barbell Bench Press",
              "target_muscles": ["Chest", "Triceps", "Shoulders"],
              "sets": "3-4",
              "reps_or_duration": "6-10 reps",
              "rest_period": "75-90 seconds",
              "notes": "Focus on controlled movements and proper form."
            },
            {
              "exercise_name": "Incline Dumbbell Press",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Use a moderate incline for optimal chest activation."
            },
            {
              "exercise_name": "Overhead Press (Barbell or Dumbbell)",
              "target_muscles": ["Shoulders", "Triceps"],
              "sets": "3-4",
              "reps_or_duration": "6-10 reps",
              "rest_period": "75-90 seconds",
              "notes": "Maintain a stable core and controlled descent."
            },
            {
              "exercise_name": "Lateral Raises",
              "target_muscles": ["Shoulders"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Focus on feeling the side deltoid working."
            },
            {
              "exercise_name": "Close-Grip Bench Press",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Keep elbows close to the body to maximize triceps activation."
            },
            {
              "exercise_name": "Triceps Pushdowns",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Use a rope attachment for better range of motion."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 2",
          "session_focus": "Pull (Back, Biceps)",
          "exercises": [
            {
              "exercise_name": "Pull-ups (or Lat Pulldowns)",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3-4",
              "reps_or_duration": "As many reps as possible (AMRAP) / 8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Use assistance if needed to achieve proper form."
            },
            {
              "exercise_name": "Barbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3-4",
              "reps_or_duration": "6-10 reps",
              "rest_period": "75-90 seconds",
              "notes": "Maintain a flat back and controlled movement."
            },
            {
              "exercise_name": "Seated Cable Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Focus on squeezing the shoulder blades together."
            },
            {
              "exercise_name": "Face Pulls",
              "target_muscles": ["Back", "Shoulders"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Use a rope attachment and focus on external rotation."
            },
            {
              "exercise_name": "Barbell Curls",
              "target_muscles": ["Biceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Maintain a stable core and avoid swinging."
            },
            {
              "exercise_name": "Hammer Curls",
              "target_muscles": ["Biceps", "Forearms"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Keep wrists neutral and focus on controlled movement."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 3",
          "session_focus": "Legs (Quads, Hamstrings, Calves)",
          "exercises": [
            {
              "exercise_name": "Barbell Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3-4",
              "reps_or_duration": "6-10 reps",
              "rest_period": "90-120 seconds",
              "notes": "Maintain proper form and depth."
            },
            {
              "exercise_name": "Leg Press",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Use a full range of motion."
            },
            {
              "exercise_name": "Romanian Deadlifts (RDLs)",
              "target_muscles": ["Hamstrings", "Glutes"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Keep back straight and focus on hip hinge."
            },
            {
              "exercise_name": "Leg Extensions",
              "target_muscles": ["Quads"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Focus on controlled contractions."
            },
            {
              "exercise_name": "Hamstring Curls",
              "target_muscles": ["Hamstrings"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Use a full range of motion."
            },
            {
              "exercise_name": "Calf Raises (Standing or Seated)",
              "target_muscles": ["Calves"],
              "sets": "4",
              "reps_or_duration": "15-20 reps",
              "rest_period": "45 seconds",
              "notes": "Focus on a full stretch and contraction."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 4",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 5",
          "session_focus": "Push (Chest, Shoulders, Triceps)",
          "exercises": [
            {
              "exercise_name": "Dumbbell Bench Press",
              "target_muscles": ["Chest", "Triceps", "Shoulders"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Focus on controlled movements and proper form."
            },
            {
              "exercise_name": "Decline Dumbbell Press",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Use a moderate decline for optimal chest activation."
            },
            {
              "exercise_name": "Arnold Press",
              "target_muscles": ["Shoulders", "Triceps"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Maintain a stable core and controlled descent."
            },
            {
              "exercise_name": "Front Raises",
              "target_muscles": ["Shoulders"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Focus on feeling the front deltoid working."
            },
            {
              "exercise_name": "Overhead Triceps Extension (Dumbbell or Cable)",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Keep elbows close to the head to maximize triceps activation."
            },
            {
              "exercise_name": "Triceps Dips (Bench or Dip Station)",
              "target_muscles": ["Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "45-60 seconds",
              "notes": "Use assistance if needed to achieve proper form."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 6",
          "session_focus": "Pull (Back, Biceps)",
          "exercises": [
            {
              "exercise_name": "Lat Pulldowns (Wide Grip)",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Use a wide grip for better lat activation."
            },
            {
              "exercise_name": "Dumbbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Maintain a flat back and controlled movement."
            },
            {
              "exercise_name": "Reverse Grip Lat Pulldowns",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "60-75 seconds",
              "notes": "Focus on squeezing the shoulder blades together."
            },
            {
              "exercise_name": "Rear Delt Flyes (Dumbbell or Machine)",
              "target_muscles": ["Back", "Shoulders"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Use a light weight and focus on controlled movement."
            },
            {
              "exercise_name": "Concentration Curls",
              "target_muscles": ["Biceps"],
              "sets": "3",
              "reps_or_duration": "10-15 reps",
              "rest_period": "60-75 seconds",
              "notes": "Focus on controlled contractions and full range of motion."
            },
            {
              "exercise_name": "Cable Curls",
              "target_muscles": ["Biceps"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Maintain constant tension on the biceps throughout the exercise."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 7",
          "session_focus": "Legs (Quads, Hamstrings, Calves)",
          "exercises": [
            {
              "exercise_name": "Front Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3-4",
              "reps_or_duration": "8-12 reps",
              "rest_period": "90-120 seconds",
              "notes": "Maintain proper form and depth."
            },
            {
              "exercise_name": "Hack Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "8-12 reps",
              "rest_period": "75-90 seconds",
              "notes": "Use a full range of motion."
            },
            {
              "exercise_name": "Glute Bridges",
              "target_muscles": ["Hamstrings", "Glutes"],
              "sets": "3-4",
              "reps_or_duration": "12-15 reps",
              "rest_period": "75-90 seconds",
              "notes": "Keep back straight and focus on hip hinge."
            },
            {
              "exercise_name": "Walking Lunges",
              "target_muscles": ["Quads"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per leg",
              "rest_period": "45-60 seconds",
              "notes": "Focus on controlled contractions."
            },
            {
              "exercise_name": "Seated Hamstring Curls",
              "target_muscles": ["Hamstrings"],
              "sets": "3",
              "reps_or_duration": "12-15 reps",
              "rest_period": "45-60 seconds",
              "notes": "Use a full range of motion."
            },
            {
              "exercise_name": "Standing Calf Raises",
              "target_muscles": ["Calves"],
              "sets": "4",
              "reps_or_duration": "15-20 reps",
              "rest_period": "45 seconds",
              "notes": "Focus on a full stretch and contraction."
            }
          ]
        }
      ],
      "cardio_guidelines": "Incorporate 20-30 minutes of moderate-intensity cardio 2-3 times per week on non-lifting days. Examples include brisk walking, jogging, cycling, or swimming.",
      "flexibility_guidelines": "Perform static stretching after each workout, holding each stretch for 20-30 seconds. Focus on major muscle groups, including chest, back, shoulders, legs, and arms. Consider incorporating yoga or Pilates for improved flexibility and mobility.",
      "precautions": "Consult with a healthcare professional before starting any new exercise program. Use proper form and technique to avoid injuries. Gradually increase weight and intensity as you get stronger. Listen to your body and take rest days when needed. Stay hydrated by drinking plenty of water throughout the day.",      
      "Coach_response": "This PPL routine is well-structured for intermediate lifters. It hits all major muscle groups with sufficient volume and frequency for growth and strength gains. Remember to prioritize progressive overload by gradually increasing weight, reps, or sets over time. Proper nutrition and rest are also crucial for optimal results."
    },
    {
      "routine_id": "CEB001",
      "routine_name": "Cardio Endurance Builder",
      "goal": "Improve cardiovascular endurance and stamina",
      "experience_level": "Beginner to Intermediate",
      "training_split": "N/A (Focus on continuous activity)",
      "days_per_week": "3-5",
      "description": "This routine focuses on gradually increasing your cardiovascular endurance through a variety of activities and intensities. It's designed to be adaptable to your current fitness level and preferences.",
      "is_preset": True,
      "weekly_schedule": [
        {
          "day_of_week_or_number": "Day 1",
          "session_focus": "Moderate Intensity Cardio",
          "exercises": [
            {
              "exercise_name": "Brisk Walking",
              "target_muscles": ["Legs", "Cardiovascular System"],
              "sets": "1",
              "reps_or_duration": "30 minutes",
              "rest_period": "N/A",
              "notes": "Maintain a pace where you can hold a conversation."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 2",
          "session_focus": "Rest or Active Recovery",
          "exercises": [
            {
              "exercise_name": "Gentle Stretching",
              "target_muscles": ["All Muscle Groups"],
              "sets": "1",
              "reps_or_duration": "15 minutes",
              "rest_period": "N/A",
              "notes": "Focus on holding each stretch for 20-30 seconds."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 3",
          "session_focus": "Interval Training",
          "exercises": [
            {
              "exercise_name": "Running/Jogging Intervals",
              "target_muscles": ["Legs", "Cardiovascular System"],
              "sets": "1",
              "reps_or_duration": "20 minutes (alternate 1 minute of jogging with 1 minute of walking)",
              "rest_period": "N/A",
              "notes": "Adjust the jogging/walking ratio as needed to maintain the workout for the full duration."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 4",
          "session_focus": "Rest or Active Recovery",
          "exercises": [
            {
              "exercise_name": "Yoga or Pilates",
              "target_muscles": ["Core", "Flexibility"],
              "sets": "1",
              "reps_or_duration": "30 minutes",
              "rest_period": "N/A",
              "notes": "Choose a beginner-friendly class."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 5",
          "session_focus": "Sustained Cardio",
          "exercises": [
            {
              "exercise_name": "Cycling",
              "target_muscles": ["Legs", "Cardiovascular System"],
              "sets": "1",
              "reps_or_duration": "40 minutes",
              "rest_period": "N/A",
              "notes": "Maintain a moderate pace on a flat or slightly inclined surface."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 6",
          "session_focus": "Rest",
          "exercises": [
            {
              "exercise_name": "Complete Rest",
              "target_muscles": [],
              "sets": "0",
              "reps_or_duration": "N/A",
              "rest_period": "N/A",
              "notes": "Allow your body to fully recover."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 7",
          "session_focus": "Active Recovery/Low Impact Cardio",
          "exercises": [
            {
              "exercise_name": "Swimming",
              "target_muscles": ["Full Body", "Cardiovascular System"],
              "sets": "1",
              "reps_or_duration": "30 minutes",
              "rest_period": "N/A",
              "notes": "Swim at a relaxed pace, focusing on technique."
            }
          ]
        }
      ],
      "cardio_guidelines": "Listen to your body and adjust the intensity and duration of each workout as needed. Warm-up before each cardio session and cool down afterwards.",
      "flexibility_guidelines": "Incorporate stretching or yoga 2-3 times per week to improve flexibility and prevent injuries. Focus on major muscle groups.",
      "precautions": "Consult with your doctor before starting any new exercise program, especially if you have any underlying health conditions. Stay hydrated and wear appropriate footwear.",
      "Coach_response": "This is a great routine to start with! Remember to gradually increase the duration or intensity of your workouts as you get fitter. Consistency is key to building endurance."
    },
   {
      "routine_id": "GF-101",
      "routine_name": "Total General Fitness",
      "goal": "Improve overall fitness, strength, and endurance.",
      "experience_level": "Beginner",
      "training_split": "Full Body",
      "days_per_week": "3",
      "description": "This routine is designed to provide a foundation of strength, cardiovascular fitness, and flexibility, suitable for beginners aiming for general physical improvement.",
      "is_preset": True,
      "weekly_schedule": [
        {
          "day_of_week_or_number": "Day 1",
          "session_focus": "Full Body Strength",
          "exercises": [
            {
              "exercise_name": "Squats",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on maintaining good form and a controlled descent."
            },
            {
              "exercise_name": "Push-ups",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "60 seconds",
              "notes": "If regular push-ups are too difficult, perform them on your knees."
            },
            {
              "exercise_name": "Dumbbell Rows",
              "target_muscles": ["Back", "Biceps"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per side",
              "rest_period": "60 seconds",
              "notes": "Maintain a flat back and pull the dumbbell towards your ribcage."
            },
            {
              "exercise_name": "Overhead Press",
              "target_muscles": ["Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Use light weight and focus on controlled movement."
            },
            {
              "exercise_name": "Plank",
              "target_muscles": ["Core"],
              "sets": "3",
              "reps_or_duration": "Hold for 30-60 seconds",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight line from head to heels and engage your core."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 2",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 3",
          "session_focus": "Cardio & Flexibility",
          "exercises": [
            {
              "exercise_name": "Brisk Walking/Jogging",
              "target_muscles": ["Cardiovascular System", "Legs"],
              "sets": "1",
              "reps_or_duration": "20-30 minutes",
              "rest_period": "N/A",
              "notes": "Maintain a pace where you can hold a conversation."
            },
            {
              "exercise_name": "Yoga/Stretching",
              "target_muscles": ["Full Body"],
              "sets": "1",
              "reps_or_duration": "20-30 minutes",
              "rest_period": "N/A",
              "notes": "Focus on holding each stretch for 20-30 seconds."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 4",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 5",
          "session_focus": "Full Body Strength",
          "exercises": [
            {
              "exercise_name": "Lunges",
              "target_muscles": ["Quads", "Hamstrings", "Glutes"],
              "sets": "3",
              "reps_or_duration": "10-12 reps per leg",
              "rest_period": "60 seconds",
              "notes": "Keep your front knee behind your toes."
            },
            {
              "exercise_name": "Incline Push-ups",
              "target_muscles": ["Chest", "Shoulders", "Triceps"],
              "sets": "3",
              "reps_or_duration": "As many reps as possible (AMRAP)",
              "rest_period": "60 seconds",
              "notes": "Perform push-ups with your hands elevated on a bench or step to make them easier."
            },
            {
              "exercise_name": "Dumbbell Deadlifts",
              "target_muscles": ["Hamstrings", "Glutes", "Back"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Maintain a straight back and hinge at your hips."
            },
            {
              "exercise_name": "Lateral Raises",
              "target_muscles": ["Shoulders"],
              "sets": "3",
              "reps_or_duration": "10-12 reps",
              "rest_period": "60 seconds",
              "notes": "Use light weight and avoid shrugging your shoulders."
            },
            {
              "exercise_name": "Crunches",
              "target_muscles": ["Core"],
              "sets": "3",
              "reps_or_duration": "15-20 reps",
              "rest_period": "60 seconds",
              "notes": "Focus on contracting your abdominal muscles."
            }
          ]
        },
        {
          "day_of_week_or_number": "Day 6",
          "session_focus": "Rest",
          "exercises": []
        },
        {
          "day_of_week_or_number": "Day 7",
          "session_focus": "Cardio & Flexibility",
          "exercises": [
            {
              "exercise_name": "Cycling/Swimming",
              "target_muscles": ["Cardiovascular System", "Legs/Full Body"],
              "sets": "1",
              "reps_or_duration": "20-30 minutes",
              "rest_period": "N/A",
              "notes": "Choose an activity you enjoy to make it more sustainable."
            },
            {
              "exercise_name": "Yoga/Stretching",
              "target_muscles": ["Full Body"],
              "sets": "1",
              "reps_or_duration": "20-30 minutes",
              "rest_period": "N/A",
              "notes": "Focus on improving your range of motion."
            }
          ]
        }
      ],
      "cardio_guidelines": "Aim for at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity cardiovascular exercise per week. Choose activities you enjoy, such as walking, jogging, cycling, or swimming.",
      "flexibility_guidelines": "Incorporate stretching or yoga into your routine at least twice a week. Focus on major muscle groups and hold each stretch for 20-30 seconds. Breathe deeply and relax into each stretch.",
      "precautions": "Consult with your doctor before starting any new exercise program. Listen to your body and stop if you experience any pain. Gradually increase the intensity and duration of your workouts over time.",
      "Coach_response": "This is a well-rounded routine for a beginner. It includes strength training, cardio, and flexibility work, hitting all the essential components of general fitness. Make sure to focus on form over weight, especially when you are first starting out."
    }
]

def create_preset_routine_via_api(routine_data):
    headers = {
        "Content-Type": "application/json",
        "X-Admin-Preset-Key": ADMIN_PRESET_KEY # Custom header for preset creation
    }
    # The payload to the API must match what your TrainingRoutineSerializer expects.
    # The `is_preset: True` tells the backend this is special.
    # The backend will handle setting `user=None`.

    response = requests.post(ROUTINES_ENDPOINT, json=routine_data, headers=headers)
    print_response(response, f"CREATE PRESET: {routine_data.get('routine_name')}")
    return response

if __name__ == "__main__":
    print("Starting external preset seeder via API...")
    successful_creations = 0
    failed_creations = 0

    for routine_payload in PRESET_ROUTINES_DATA:
        # It's harder for an external script to know if a preset already exists
        # unless you have a GET endpoint that can query by routine_id and is_preset.
        # For simplicity, this script will attempt to create them.
        # Your API should ideally handle duplicate routine_id for presets gracefully (e.g., 400 error).

        print(f"\nAttempting to create preset: {routine_payload.get('routine_name')}")
        response = create_preset_routine_via_api(routine_payload)
        if response.status_code == 201: # HTTP 201 Created
            successful_creations += 1
        else:
            failed_creations += 1

    print("\n--- Seeding Summary ---")
    print(f"Successfully created presets: {successful_creations}")
    print(f"Failed to create presets: {failed_creations}")
    if failed_creations > 0:
        print("Check API responses above for failure reasons.")
    print("External preset seeding finished.")