from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise
from .serializers import UserSerializer,UserProfileSerializer,TrainingRoutineSerializer
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
import time
import os
import json
from rest_framework.views import APIView
from google import genai
from google.generativeai import types as GenAITypes
from pydantic import BaseModel, Field, ValidationError as PydanticValidationError
from typing import List, Optional
from dotenv import load_dotenv

# Create your views here.

# Signup View
class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] # Anyone can sign up

class UserProfileCreateView(generics.CreateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if UserProfile.objects.filter(user=self.request.user).exists():
            raise ValidationError("Profile already exists for this user.")
        serializer.save(user=self.request.user)

class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        if created:
            print(f"Profile created on first access for user {self.request.user.username}")
        return profile
    

##############################################################################################

class TrainingRoutineListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingRoutineSerializer


    def get_queryset(self):
        user = self.request.user
        # Return presets OR routines belonging to the current user
        return TrainingRoutine.objects.filter(
            Q(is_preset=True) | Q(user=user)
        ).distinct().order_by('-is_preset', '-created_at') # Presets first, then user's

    def get_permissions(self):
        if self.request.method == 'POST':
            # If 'is_preset' is true in payload, perhaps use different permission
            # This is a simplified check; real-world would be more robust
            if self.request.data.get('is_preset') and self.request.headers.get('X-Admin-Preset-Key') == 'YOUR_SECRET_KEY':
                return [permissions.AllowAny()] # Or a custom IsAdminOrSpecialKey permission
        return [permissions.IsAuthenticated()]


    def perform_create(self, serializer):
        is_preset_payload = self.request.data.get('is_preset', False)
        admin_key_present = self.request.headers.get('X-Admin-Preset-Key') == 'YOUR_SECRET_KEY' # Example

        if is_preset_payload and admin_key_present:
            serializer.save(user=None, is_preset=True) # Preset creation
        elif self.request.user.is_authenticated:
            serializer.save(user=self.request.user, is_preset=False) # User's custom routine
        else:
            # This case should ideally be caught by permissions earlier
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Authentication required or invalid preset creation attempt.")

class TrainingRoutineDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainingRoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return TrainingRoutine.objects.filter(
            Q(is_preset=True) | Q(user=user)
        ).distinct()

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.is_preset and not self.request.user.is_staff: # Only staff can edit presets
            raise PermissionDenied("You do not have permission to edit preset routines.")
        # For user-owned routines, ensure they are the owner (already handled by get_queryset for non-staff)
        serializer.save() # For user routines, user will be implicitly the same

    def perform_destroy(self, instance):
        if instance.is_preset and not self.request.user.is_staff: # Only staff can delete presets
            raise PermissionDenied("You do not have permission to delete preset routines.")
        instance.delete()

    @action(detail=True, methods=['post'], url_path='copy', permission_classes=[permissions.IsAuthenticated])
    def copy_routine(self, request, pk=None):
        original_routine = self.get_object() # Gets the routine by pk (could be a preset)

        if not original_routine: # Should be caught by get_object if not found
            return Response({"detail": "Routine not found."}, status=status.HTTP_404_NOT_FOUND)

        # Create a new routine for the current user based on the original
        new_routine_data = {
            "user": request.user,
            "is_preset": False, # This is now a user's custom routine
            "routine_id": f"{original_routine.routine_id}_copy_{int(time.time())}", # Ensure unique ID
            "routine_name": f"{original_routine.routine_name} (Copy)",
            "goal": original_routine.goal,
            "experience_level": original_routine.experience_level,
            "training_split": original_routine.training_split,
            "days_per_week": original_routine.days_per_week,
            "description": original_routine.description,
            "cardio_guidelines": original_routine.cardio_guidelines,
            "flexibility_guidelines": original_routine.flexibility_guidelines,
            "precautions": original_routine.precautions,
            "coach_response": "Copied from preset. Adjust as needed." # Or clear it
        }

        # Deep copy weekly schedule and exercises
        new_routine = TrainingRoutine.objects.create(**new_routine_data)

        for original_schedule_item in original_routine.weekly_schedule.all():
            new_schedule_item = WeeklyScheduleItem.objects.create(
                routine=new_routine,
                day_of_week_or_number=original_schedule_item.day_of_week_or_number,
                session_focus=original_schedule_item.session_focus
            )
            for original_exercise in original_schedule_item.exercises.all():
                Exercise.objects.create(
                    schedule_item=new_schedule_item,
                    exercise_name=original_exercise.exercise_name,
                    target_muscles=original_exercise.target_muscles,
                    sets=original_exercise.sets,
                    reps_or_duration=original_exercise.reps_or_duration,
                    rest_period=original_exercise.rest_period,
                    notes=original_exercise.notes
                )

        serializer = self.get_serializer(new_routine)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
#############################################################################

class GeminiExercise(BaseModel):
    exercise_name: str = Field(..., description="Name of the exercise.")
    target_muscles: List[str] = Field(..., description="Primary muscle groups targeted by the exercise.")
    sets: str = Field(..., description="Number of sets to perform (e.g., '2-3', '3-4').")
    reps_or_duration: str = Field(..., description="Number of repetitions or duration of the exercise (e.g., '8-12 reps', 'Hold for 20-30 seconds').")
    rest_period: str = Field(..., description="Rest time between sets (e.g., '60-90 seconds').")
    notes: Optional[str] = Field(None, description="Additional notes or tips for performing the exercise.")

class GeminiWeeklyScheduleItem(BaseModel):
    day_of_week_or_number: str = Field(..., description="Specifies the sequence number for this part of the schedule (e.g.,'Day 1', 'Day 2', 'Day 3 )(all days should be included even if its resting day).")
    session_focus: str = Field(..., description="The main focus of this training session (e.g., 'Full Body Strength', 'Upper Body Strength & Hypertrophy').")
    exercises: List[GeminiExercise] = Field(..., description="List of exercises to be performed in this session.")

class GeminiTrainingRoutine(BaseModel):
    routine_id: str = Field(..., description="A unique identifier for the training routine. Can be a placeholder like 'NEW_ROUTINE'.")
    routine_name: str = Field(..., description="The name of the training routine.")
    goal: str = Field(..., description="The primary goal of this training routine (e.g., 'Build foundational strength and muscle').")
    experience_level: str = Field(..., description="Target experience level for this routine (e.g., 'Beginner', 'Intermediate').")
    training_split: str = Field(..., description="The type of training split used (e.g., 'Full Body', 'Upper/Lower').")
    days_per_week: str = Field(..., description="Recommended number of training days per week (e.g., '2-3', '4').")
    description: str = Field(..., description="A brief description of the training routine.")
    is_preset: bool = Field( description="This should always be False for user-generated routines.") # Default to False
    weekly_schedule: List[GeminiWeeklyScheduleItem] = Field(..., description="The detailed weekly schedule of workouts.")
    cardio_guidelines: Optional[str] = Field(None, description="General guidelines for cardiovascular exercise alongside this routine.")
    flexibility_guidelines: Optional[str] = Field(None, description="General guidelines for flexibility work.")
    precautions: Optional[str] = Field(None, description="Important precautions or warnings for this routine.")
    coach_response: str = Field(..., description="AI's response/reasoning based on the prompt.")

# --- Gemini Configuration ---
# Store your API key securely, e.g., in environment variables or Django settings
load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE_IF_NOT_IN_ENV")
genai_client = None

try:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
    print("--- Gemini Client Initialized ---")
except Exception as e:
    print(f"Error initializing Gemini Client: {e}")
    genai_client = None


class GenerateWorkoutView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users can use this

    def post(self, request, *args, **kwargs):
        if not genai_client:
            return Response(
                {"error": "Gemini AI client not initialized. Check API key and server logs."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        user_prompt = request.data.get('prompt')
        existing_routine_data_str = request.data.get('existing_routine_json') # For modifications

        if not user_prompt:
            return Response({"error": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Construct the message for Gemini
        full_prompt_message = user_prompt
        if existing_routine_data_str:
            try:
                # You might want to pretty-print or summarize the existing routine
                # to keep the context for Gemini concise but informative.
                # For now, just appending the string.
                full_prompt_message = (
                    f"User wants to modify an existing routine. "
                    f"Their prompt for modification is: '{user_prompt}'.\n\n"
                    f"Here is the JSON of the current routine they want to modify:\n"
                    f"{existing_routine_data_str}\n\n"
                    f"Please provide the modified routine based on the prompt, "
                    f"maintaining the same overall JSON structure as defined in the schema."
                )
                # print("--- Sending to Gemini (Modification) ---")
                # print(f"Prompt context: {full_prompt_message[:500]}...") # Log a snippet
            except Exception as e:
                # print(f"Error processing existing_routine_json: {e}")
                # Proceed with just the user prompt if parsing existing data fails
                pass


        try:
            chat_session = genai_client.chats.create(
                model="gemini-2.0-flash",
                config={
                                "system_instruction":"You are a physical training coach. make sure to give workout routine that are healthy for the user",
                                "response_mime_type": "application/json",
                                "response_schema": GeminiTrainingRoutine,
                            },
            )
            gemini_response_obj = chat_session.send_message(full_prompt_message)
            # print("--- Gemini Response Object ---")
            # print(gemini_response_obj)
            raw_json_response = gemini_response_obj.text
            # print("--- Raw Gemini JSON Response ---")
            # print(raw_json_response)


            # Validate the JSON response against your Pydantic model
            try:
                # Attempt to parse the raw JSON string first
                parsed_json_data = json.loads(raw_json_response)
                # Then validate with Pydantic
                validated_routine = GeminiTrainingRoutine(**parsed_json_data)
                # Pydantic model automatically converts to dict with .model_dump() (v2) or .dict() (v1)
                return Response(validated_routine.model_dump(), status=status.HTTP_200_OK)
            except json.JSONDecodeError as json_err:
                print(f"Gemini response was not valid JSON: {json_err}")
                # print(f"Faulty JSON string: {raw_json_response}")
                return Response(
                    {"error": "AI response was not valid JSON.", "details": str(json_err), "raw_response": raw_json_response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except PydanticValidationError as e:
                print(f"Pydantic Validation Error: {e.errors()}")
                return Response(
                    {"error": "AI response did not match expected structure.", "details": e.errors(), "raw_response": raw_json_response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            # Catching broad exceptions from Gemini API call
            print(f"Error calling Gemini API: {e}")
            # Check for specific Gemini error types if available in the SDK
            if hasattr(e, 'message'):
                error_detail = e.message
            else:
                error_detail = str(e)

            # Handle specific blocked prompt error (example)
            if "blocked" in error_detail.lower() and "prompt" in error_detail.lower():
                 return Response(
                    {"error": "Your prompt was blocked by the AI's safety filters. Please rephrase your request."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"error": "Failed to generate workout from AI.", "details": error_detail},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )