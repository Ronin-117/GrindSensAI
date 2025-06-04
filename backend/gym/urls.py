from django.urls import path
from . import views 
from .views import UserCreateView, UserProfileCreateView, UserProfileDetailView, TrainingRoutineListCreateView, TrainingRoutineDetailView,GenerateWorkoutView,UserWorkoutPlanView , DailyLogGetOrCreateView, DailyLogDetailView

urlpatterns = [
    path('register/', UserCreateView.as_view(), name='user-register'),
    path('profile/', UserProfileDetailView.as_view(), name='user-profile-detail'),
    path('profile/create/', UserProfileCreateView.as_view(), name='user-profile-create'),

    path('routines/', TrainingRoutineListCreateView.as_view(), name='routine-list-create'),
    path('routines/<int:pk>/', TrainingRoutineDetailView.as_view(), name='routine-detail'),
    path('generate-workout/', GenerateWorkoutView.as_view(), name='generate-workout'),
    path('workout-plan/', UserWorkoutPlanView.as_view(), name='user-workout-plan'),
    path('daily-logs/get-or-create-for-date/', DailyLogGetOrCreateView.as_view(), name='daily-log-get-or-create'),
    path('daily-logs/<int:pk>/', DailyLogDetailView.as_view(), name='daily-log-detail'),
]

