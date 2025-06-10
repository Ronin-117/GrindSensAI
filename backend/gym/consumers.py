# myapp/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async # For calling synchronous Django ORM code
from .models import DailyWorkoutLog, Exercise as DjangoExerciseModel # Your Django model
from . import exes # Import your exercise tracking functions

# This dictionary will map exercise names (or IDs) from your frontend/routine
# to the corresponding tracking functions in exes.py
EXERCISE_TRACKERS = {
    "curl_l": exes.curl_l,
    "curl_r": exes.curl_r,
    "curl": exes.curl_r,
    "bicep curl": exes.curl_l, # Example mapping, use specific names
    "dumbbell bicep curl": exes.curl_l,
    "shoulder_press": exes.shoulder_press,
    "dumbbell shoulder press": exes.shoulder_press,
    "lateral_raise": exes.lateral_raise,
    "dumbbell lateral raise": exes.lateral_raise,
    "squat": exes.squat,
    "bodyweight squats": exes.squat,
    "goblet squats": exes.squat,
    "sit_up": exes.sit_up,
    "leg_raise": exes.leg_raise,
    "jumping_jacks": exes.jumping_jacks,
    # Add all your exercises and map them to the correct function
    # The key should match item.exercise_name (or a standardized version of it)
}

class SupervisionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.exercise_id_param = self.scope['url_route']['kwargs']['exercise_id'] # original_exercise_id from LoggedExercise
        self.room_group_name = f'supervision_{self.user.id}_{self.exercise_id_param}'

        if not self.user.is_authenticated:
            await self.close()
            return

        # --- Per-connection state for exercise tracking ---
        self.rep_counter = 0
        self.stage = None # 'up', 'down', etc.
        self.current_sets_completed = 0 # We'll fetch this from DB
        self.target_sets = 1 # Default, will be fetched
        self.exercise_tracker_func = None
        self.daily_log_id = None # To update the specific DailyWorkoutLog

        # Join room group (not strictly necessary for 1-to-1 but good practice)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print(f"WebSocket connected for user {self.user.username}, exercise_id_param: {self.exercise_id_param}")
        # Send a confirmation or initial state if needed
        await self.send(text_data=json.dumps({"type": "connection_established", "message": "Supervision connected!"}))

        # Initialize exercise state (fetch target sets, current sets)
        await self.initialize_exercise_state()


    async def disconnect(self, close_code):
        print(f"WebSocket disconnected for user {self.user.username}, exercise: {self.exercise_id_param}")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'pose_landmarks':
            landmarks_data = data.get('landmarks')
            exercise_name_from_frontend = data.get('exercise_name', '').lower().replace(" ", "_") # Standardize
            
            if not landmarks_data:
                return

            if not self.exercise_tracker_func:
                # Attempt to map exercise_name to a tracker function
                # This mapping should be robust based on how exercise names are stored/sent
                standardized_name = exercise_name_from_frontend 
                # A more robust mapping might involve checking exercise_id_param against DB Exercise model
                if standardized_name in EXERCISE_TRACKERS:
                    self.exercise_tracker_func = EXERCISE_TRACKERS[standardized_name]
                    print(f"Tracker function for '{standardized_name}' set to {self.exercise_tracker_func.__name__}")
                else:
                    print(f"No tracker function found for exercise: {exercise_name_from_frontend}")
                    await self.send(text_data=json.dumps({"type": "error", "message": f"Exercise '{exercise_name_from_frontend}' not supported for AI counting."}))
                    return
            
            # Convert landmarks for your exes.py functions
            # Your exes.py functions expect a list-like structure where each element has .x, .y
            # MediaPipe frontend landmarks are {x: val, y: val, z: val, visibility: val}
            # The `exes.py` functions seem to only use .x and .y directly from the landmark object itself
            # So, the landmarks_data (which is results.poseLandmarks from frontend) should be directly usable
            # if `landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]` works.
            
            # Call the specific exercise tracking function
            try:
                # Assuming landmarks_data is the array of landmark objects
                new_stage, new_counter = self.exercise_tracker_func(landmarks_data, self.stage, self.rep_counter)

                rep_counted_this_frame = False
                if new_counter > self.rep_counter:
                    rep_counted_this_frame = True
                    print(f"Rep counted for {self.user.username}! Total reps this set: {new_counter}")
                    # Send rep count update to frontend
                    await self.send(text_data=json.dumps({
                        'type': 'rep_update',
                        'current_reps_this_set': new_counter,
                        'stage': new_stage
                    }))

                self.stage = new_stage
                self.rep_counter = new_counter # This is reps for the current set being tracked

                # Check if target reps for a set are met (needs target_reps_per_set logic)
                # For now, let's assume a fixed 10 reps per set for simplicity to test set completion
                TARGET_REPS_PER_SET_EXAMPLE = 10 # This should come from the exercise details
                
                if rep_counted_this_frame and self.rep_counter >= TARGET_REPS_PER_SET_EXAMPLE:
                    self.current_sets_completed += 1
                    self.rep_counter = 0 # Reset rep counter for the new set
                    self.stage = None # Reset stage for the new set
                    print(f"Set completed for {self.user.username}! Sets done: {self.current_sets_completed}/{self.target_sets}")

                    await self.update_db_sets_completed()

                    await self.send(text_data=json.dumps({
                        'type': 'set_update',
                        'sets_completed': self.current_sets_completed,
                        'total_target_sets': self.target_sets,
                        'message': f"Set {self.current_sets_completed} complete!"
                    }))

                    if self.current_sets_completed >= self.target_sets:
                        print(f"All sets completed for exercise {self.exercise_id_param} by {self.user.username}!")
                        await self.send(text_data=json.dumps({
                            'type': 'exercise_complete',
                            'message': 'Exercise complete! Well done!'
                        }))
                        # Optionally, auto-disconnect or wait for user to stop supervision
                        # await self.close()


            except TypeError as te: # Catches errors if landmarks are not in expected format for tracker
                print(f"TypeError in tracker function: {te}. Landmarks format might be incorrect.")
                print(f"Received landmarks_data snippet: {str(landmarks_data)[:200]}") # Log a snippet
            except Exception as e:
                print(f"Error processing pose for {self.exercise_tracker_func.__name__ if self.exercise_tracker_func else 'unknown exercise'}: {e}")
                await self.send(text_data=json.dumps({"type": "error", "message": "Error processing pose."}))


    @sync_to_async
    def initialize_exercise_state(self):
        # Fetch DailyWorkoutLog for today and this user/plan
        # Then find the specific exercise by original_exercise_id (self.exercise_id_param)
        # And get its target_sets and current actual_sets_completed
        try:
            today_date = timezone.now().date()
            # Assuming self.exercise_id_param is the original_exercise_id (PK of Exercise in routine)
            numeric_exercise_id = int(self.exercise_id_param)

            # Find the daily log
            daily_log = DailyWorkoutLog.objects.filter(
                workout_plan__user=self.user,
                date=today_date
            ).first()

            if not daily_log:
                print(f"Error: No DailyWorkoutLog found for user {self.user.id} on {today_date}")
                async_to_sync(self.send)(text_data=json.dumps({"type": "error", "message": "Today's workout log not found."}))
                return

            self.daily_log_id = daily_log.id
            found_exercise_log = None
            for ex_log in daily_log.logged_exercises:
                if ex_log.get("original_exercise_id") == numeric_exercise_id:
                    found_exercise_log = ex_log
                    break
            
            if found_exercise_log:
                self.current_sets_completed = found_exercise_log.get("actual_sets_completed", 0)
                target_sets_str = found_exercise_log.get("target_sets", "1")
                try:
                    # Use the higher number if it's a range like "3-4"
                    self.target_sets = int(target_sets_str.split('-')[-1])
                except ValueError:
                    self.target_sets = 1
                print(f"Initialized state for exercise {numeric_exercise_id}: Current Sets {self.current_sets_completed}, Target Sets {self.target_sets}")
                async_to_sync(self.send)(text_data=json.dumps({
                    "type": "initial_state",
                    "current_sets_completed": self.current_sets_completed,
                    "target_sets": self.target_sets,
                    "exercise_name": found_exercise_log.get("exercise_name")
                }))

            else:
                print(f"Error: Exercise with original_id {numeric_exercise_id} not found in today's log for user {self.user.id}")
                async_to_sync(self.send)(text_data=json.dumps({"type": "error", "message": "Exercise not found in today's log."}))

        except Exception as e:
            print(f"Error initializing exercise state: {e}")
            async_to_sync(self.send)(text_data=json.dumps({"type": "error", "message": "Error initializing supervision state."}))


    @sync_to_async
    def update_db_sets_completed(self):
        if self.daily_log_id is None:
            print("Error: daily_log_id not set, cannot update DB.")
            return

        try:
            daily_log = DailyWorkoutLog.objects.get(id=self.daily_log_id)
            updated_logged_exercises = []
            exercise_updated_in_log = False
            numeric_exercise_id = int(self.exercise_id_param)

            for ex_log in daily_log.logged_exercises:
                if ex_log.get("original_exercise_id") == numeric_exercise_id:
                    ex_log["actual_sets_completed"] = self.current_sets_completed
                    # Update completed_status based on sets
                    target_sets_for_status_str = ex_log.get("target_sets", "1")
                    try:
                        target_sets_for_status = int(target_sets_for_status_str.split('-')[-1])
                    except ValueError:
                        target_sets_for_status = 1
                    
                    if self.current_sets_completed >= target_sets_for_status:
                        ex_log["completed_status"] = "full"
                    elif self.current_sets_completed > 0:
                        ex_log["completed_status"] = "partial"
                    else:
                        ex_log["completed_status"] = "pending"
                    exercise_updated_in_log = True
                updated_logged_exercises.append(ex_log)
            
            if exercise_updated_in_log:
                daily_log.logged_exercises = updated_logged_exercises
                # Recalculate overall completion percentage
                # (You'd need your Python version of calculateOverallCompletion here)
                # daily_log.completion_percentage = self.calculate_overall_log_completion(daily_log.logged_exercises)
                daily_log.save(update_fields=['logged_exercises']) #, 'completion_percentage'
                print(f"DB updated for log {self.daily_log_id}, exercise {self.exercise_id_param}, sets: {self.current_sets_completed}")
            else:
                print(f"Exercise {self.exercise_id_param} not found in log {self.daily_log_id} during DB update attempt.")

        except DailyWorkoutLog.DoesNotExist:
            print(f"Error: DailyWorkoutLog with id {self.daily_log_id} not found for DB update.")
        except Exception as e:
            print(f"Error updating DB sets completed: {e}")

    # def calculate_overall_log_completion(self, logged_exercises_list):
    #     # Python equivalent of your frontend completion calculation
    #     if not logged_exercises_list: return 100 if some_condition_for_rest else 0
    #     # ... implementation ...
    #     return calculated_percentage