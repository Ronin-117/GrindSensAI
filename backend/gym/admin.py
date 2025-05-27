from django.contrib import admin
from .models import UserProfile, TrainingRoutine, WeeklyScheduleItem, Exercise


# Register your models here.
admin.site.register(UserProfile)
admin.site.register(TrainingRoutine)
admin.site.register(WeeklyScheduleItem)
admin.site.register(Exercise)


