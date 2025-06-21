from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise,WorkoutPlan,DailyWorkoutLog
from .serializers import UserSerializer,UserProfileSerializer,TrainingRoutineSerializer,WorkoutPlanSerializer,DailyWorkoutLogSerializer
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
from django.utils import timezone
from datetime import datetime,timedelta

# Create your views here.

# Signup View
class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] 

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
        return TrainingRoutine.objects.filter(
            Q(is_preset=True) | Q(user=user)
        ).distinct().order_by('-is_preset', '-created_at') 

    def get_permissions(self):
        if self.request.method == 'POST':
            if self.request.data.get('is_preset') and self.request.headers.get('X-Admin-Preset-Key') == 'YOUR_SECRET_KEY':
                return [permissions.AllowAny()] 
        return [permissions.IsAuthenticated()]


    def perform_create(self, serializer):
        is_preset_payload = self.request.data.get('is_preset', False)
        admin_key_present = self.request.headers.get('X-Admin-Preset-Key') == 'YOUR_SECRET_KEY'

        if is_preset_payload and admin_key_present:
            serializer.save(user=None, is_preset=True) 
        elif self.request.user.is_authenticated:
            serializer.save(user=self.request.user, is_preset=False)
        else:
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
        if instance.is_preset and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to edit preset routines.")
        serializer.save() 

    def perform_destroy(self, instance):
        if instance.is_preset and not self.request.user.is_staff:
            raise PermissionDenied("You do not have permission to delete preset routines.")
        instance.delete()

    @action(detail=True, methods=['post'], url_path='copy', permission_classes=[permissions.IsAuthenticated])
    def copy_routine(self, request, pk=None):
        original_routine = self.get_object() 

        if not original_routine:
            return Response({"detail": "Routine not found."}, status=status.HTTP_404_NOT_FOUND)

        new_routine_data = {
            "user": request.user,
            "is_preset": False,
            "routine_id": f"{original_routine.routine_id}_copy_{int(time.time())}",
            "routine_name": f"{original_routine.routine_name} (Copy)",
            "goal": original_routine.goal,
            "experience_level": original_routine.experience_level,
            "training_split": original_routine.training_split,
            "days_per_week": original_routine.days_per_week,
            "description": original_routine.description,
            "cardio_guidelines": original_routine.cardio_guidelines,
            "flexibility_guidelines": original_routine.flexibility_guidelines,
            "precautions": original_routine.precautions,
            "coach_response": "Copied from preset. Adjust as needed."
        }

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
    day_of_week_or_number: str = Field(..., description="Specifies the sequence number for this part of the schedule (e.g.,'Day 1', 'Day 2', 'Day 3 )(all days should be included even if its resting day)(try to use consistant patterns, like dont use 'monday' pattern, if you are using 'day 1' pattern).")
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
load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE_IF_NOT_IN_ENV")
genai_client = None

try:
    genai_client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing Gemini Client: {e}")
    genai_client = None


class GenerateWorkoutView(APIView):
    permission_classes = [permissions.IsAuthenticated] 

    def post(self, request, *args, **kwargs):
        if not genai_client:
            return Response(
                {"error": "Gemini AI client not initialized. Check API key and server logs."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        user_prompt = request.data.get('prompt')
        existing_routine_data_str = request.data.get('existing_routine_json')

        if not user_prompt:
            return Response({"error": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        full_prompt_message = user_prompt
        if existing_routine_data_str:
            try:
                full_prompt_message = (
                    f"User wants to modify an existing routine. "
                    f"Their prompt for modification is: '{user_prompt}'.\n\n"
                    f"Here is the JSON of the current routine they want to modify:\n"
                    f"{existing_routine_data_str}\n\n"
                    f"Please provide the modified routine based on the prompt, "
                    f"maintaining the same overall JSON structure as defined in the schema."
                )
            except Exception as e:
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
            raw_json_response = gemini_response_obj.text


            try:
                parsed_json_data = json.loads(raw_json_response)
                validated_routine = GeminiTrainingRoutine(**parsed_json_data)
                return Response(validated_routine.model_dump(), status=status.HTTP_200_OK)
            except json.JSONDecodeError as json_err:
                print(f"Gemini response was not valid JSON: {json_err}")
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
            print(f"Error calling Gemini API: {e}")
            if hasattr(e, 'message'):
                error_detail = e.message
            else:
                error_detail = str(e)

            if "blocked" in error_detail.lower() and "prompt" in error_detail.lower():
                 return Response(
                    {"error": "Your prompt was blocked by the AI's safety filters. Please rephrase your request."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"error": "Failed to generate workout from AI.", "details": error_detail},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class UserWorkoutPlanView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's workout plan.
    Users will typically have one workout plan.
    """
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        plan, created = WorkoutPlan.objects.get_or_create(user=self.request.user)
        if created:
            print(f"WorkoutPlan created for user: {self.request.user.username}")
        return plan
    
#############################################

class DailyLogGetOrCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        date_str = request.data.get('date')
        if not date_str:
            return Response({"error": "Date is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            log_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        try:
            workout_plan = WorkoutPlan.objects.get(user=user)
        except WorkoutPlan.DoesNotExist:
            return Response({"error": "User has no active workout plan."}, status=status.HTTP_404_NOT_FOUND)

        if not workout_plan.current_routine:
            return Response({"error": "No routine selected in the current workout plan."}, status=status.HTTP_400_BAD_REQUEST)

        daily_log, created = DailyWorkoutLog.objects.get_or_create(
            workout_plan=workout_plan,
            date=log_date,
            defaults={
                'routine_used': workout_plan.current_routine,
                'routine_log_name': workout_plan.current_routine.routine_name,
                'logged_exercises': self.get_exercises_for_day(workout_plan.current_routine, log_date),
                'completion_percentage': 0 
            }
        )

        if created:
            print(f"Created new DailyWorkoutLog for {user.username} on {log_date}")
        else:
            pass


        serializer = DailyWorkoutLogSerializer(daily_log) 
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    def get_exercises_for_day(self, routine: TrainingRoutine, log_date: datetime.date):
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_of_week_str_long = day_names[log_date.weekday()] 
        day_of_week_str_short = day_of_week_str_long[:3]
        numeric_day_str = f"Day {log_date.weekday() + 1}" 

        schedule_item_for_today = routine.weekly_schedule.filter(
            Q(day_of_week_or_number__iexact=day_of_week_str_long) |
            Q(day_of_week_or_number__iexact=day_of_week_str_short) |
            Q(day_of_week_or_number__iexact=numeric_day_str) 
        ).first()

        logged_exercises_list = []
        if schedule_item_for_today:
            for exercise in schedule_item_for_today.exercises.all().order_by('id'):
                logged_exercises_list.append({
                    "original_exercise_id": exercise.pk,
                    "exercise_name": exercise.exercise_name,
                    "target_muscles": exercise.target_muscles, 
                    "target_sets": exercise.sets,
                    "target_reps_or_duration": exercise.reps_or_duration,
                    "notes_from_routine": exercise.notes,
                    "completed_status": "pending",
                    "actual_sets_completed": 0,
                    "actual_reps_per_set": [],
                    "actual_duration_seconds": None,
                    "weight_used_per_set": [],
                    "user_notes_for_exercise": ""
                })
        return logged_exercises_list
    
class DailyLogDetailView(generics.RetrieveUpdateAPIView): 
    serializer_class = DailyWorkoutLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = DailyWorkoutLog.objects.all() # Standard queryset
    
    def get_queryset(self):
        return DailyWorkoutLog.objects.filter(workout_plan__user=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        print(f"DailyWorkoutLog {instance.id} updated. Completion: {instance.completion_percentage}%")

class WorkoutContributionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        one_year_ago = timezone.now().date() - timedelta(days=365)
        
        logs = DailyWorkoutLog.objects.filter(
            workout_plan__user=user,
            date__gte=one_year_ago
        ).values('date', 'completion_percentage')
        
        return Response(list(logs))