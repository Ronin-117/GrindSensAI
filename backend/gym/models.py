from django.db import models
from django.contrib.auth.models import User


# Create your models here.
class UserProfile(models.Model): # Optional: for extra user-specific info
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    weight = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class TrainingRoutine(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='training_routines' , null=True, blank=True)
    is_preset = models.BooleanField(default=False, help_text="Is this a system-wide preset routine?")
    routine_id = models.CharField(max_length=100) 
    routine_name = models.CharField(max_length=255)
    goal = models.TextField()
    experience_level = models.CharField(max_length=100)
    training_split = models.CharField(max_length=100)
    days_per_week = models.CharField(max_length=50)
    description = models.TextField()
    cardio_guidelines = models.TextField(null=True, blank=True)
    flexibility_guidelines = models.TextField(null=True, blank=True)
    precautions = models.TextField(null=True, blank=True)
    coach_response = models.TextField(default="No coach feedback.") 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        prefix = "[PRESET] " if self.is_preset else f"[{self.user.username if self.user else 'NO_USER'}] "
        return f"{prefix}{self.routine_name}"

class WeeklyScheduleItem(models.Model):
    routine = models.ForeignKey(TrainingRoutine, on_delete=models.CASCADE, related_name='weekly_schedule')
    day_of_week_or_number = models.CharField(max_length=255)
    session_focus = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.day_of_week_or_number} - {self.session_focus} (Routine: {self.routine.routine_name})"

class Exercise(models.Model):
    schedule_item = models.ForeignKey(WeeklyScheduleItem, on_delete=models.CASCADE, related_name='exercises')
    exercise_name = models.CharField(max_length=255)
    # For target_muscles: List[str]
    # Option 1: JSONField (easiest for direct mapping, good for most DBs)
    target_muscles = models.JSONField(default=list)
    # Option 2: CharField with comma separation (requires parsing)
    # target_muscles_text = models.TextField(help_text="Comma-separated list of muscles")
    # Option 3: ArrayField (PostgreSQL specific)
    # target_muscles = ArrayField(models.CharField(max_length=100), blank=True, default=list)
    sets = models.CharField(max_length=50)
    reps_or_duration = models.CharField(max_length=100)
    rest_period = models.CharField(max_length=100)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.exercise_name