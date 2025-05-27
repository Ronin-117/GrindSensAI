from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile, TrainingRoutine
from .serializers import UserSerializer,UserProfileSerializer,TrainingRoutineSerializer
from rest_framework.exceptions import ValidationError

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
        # get_or_create ensures a profile exists or is made if accessed,
        # or you can just use get() if creation is strictly via UserProfileCreateView
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        if created:
            print(f"Profile created on first access for user {self.request.user.username}")
        return profile
    

##############################################################################################

class TrainingRoutineListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingRoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return routines belonging to the currently authenticated user
        return TrainingRoutine.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically associate the new routine with the logged-in user
        serializer.save(user=self.request.user)

class TrainingRoutineDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainingRoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users can only access/modify their own routines
        return TrainingRoutine.objects.filter(user=self.request.user)