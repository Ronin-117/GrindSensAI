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