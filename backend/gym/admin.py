from django.contrib import admin
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise,WorkoutPlan,DailyWorkoutLog


# Register your models here.
admin.site.register(UserProfile)
admin.site.register(TrainingRoutine)
admin.site.register(WeeklyScheduleItem)
admin.site.register(Exercise)
admin.site.register(WorkoutPlan)
admin.site.register(DailyWorkoutLog)


