from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import timedelta, date as DateObject


# Create your models here.
class UserProfile(models.Model): 
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
    target_muscles = models.JSONField(default=list)
    sets = models.CharField(max_length=50)
    reps_or_duration = models.CharField(max_length=100)
    rest_period = models.CharField(max_length=100)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.exercise_name
    
####################################################################

class WorkoutPlan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='workout_plan')
    current_routine = models.ForeignKey(
        'TrainingRoutine',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='active_in_plans',
        help_text="The training routine currently selected by the user for this plan."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        routine_name = self.current_routine.routine_name if self.current_routine else "No routine selected"
        return f"{self.user.username}'s Workout Plan ({routine_name})"

    @property
    def heat_level(self): 
        """
        Calculates the heat_level dynamically based on the
        average completion percentage of DailyWorkoutLogs in the last 7 days.
        """
        today = timezone.now().date()
        seven_days_ago = today - timedelta(days=6) 

        recent_logs = self.daily_logs.filter( 
            date__gte=seven_days_ago,
            date__lte=today
        )

        if not recent_logs.exists():
            return 0

        total_percentage_sum = 0
        for log in recent_logs:
            total_percentage_sum += log.completion_percentage

        days_in_period = 7
        average_completion_percentage_over_period = total_percentage_sum / days_in_period

        calculated_heat = round(average_completion_percentage_over_period / 10)
        return max(0, min(10, calculated_heat))

class DailyWorkoutLog(models.Model):
    workout_plan = models.ForeignKey(
        WorkoutPlan, 
        on_delete=models.CASCADE,
        related_name='daily_logs', 
        help_text="The workout plan this log belongs to."
    )
    date = models.DateField(default=timezone.now, help_text="The date this workout was performed or scheduled for.")
    routine_log_name = models.CharField(max_length=255, blank=True, help_text="Name of the routine used for this day's log.")
    routine_used = models.ForeignKey(
        'TrainingRoutine',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logged_as_daily_workout',
        help_text="Reference to the actual routine instance used for this log, if available."
    )
    logged_exercises = models.JSONField(default=list, help_text="Details of exercises logged for the day, including completion.", null=True,blank=True,)
    completion_percentage = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0),MaxValueValidator(100)],
        help_text="Overall completion percentage for this day's workout."
    )
    session_notes = models.TextField(blank=True, null=True, help_text="Overall notes for this workout session.")

    class Meta:
        unique_together = ('workout_plan', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"Log for {self.workout_plan.user.username} on {self.date} ({self.completion_percentage}%)"

    def save(self, *args, **kwargs):
        if self.workout_plan and self.workout_plan.current_routine and not self.routine_used:
            self.routine_used = self.workout_plan.current_routine
            self.routine_log_name = self.workout_plan.current_routine.routine_name
        super().save(*args, **kwargs)