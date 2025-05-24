from django.urls import path
from . import views 
from .views import UserCreateView, UserProfileCreateView, UserProfileDetailView

urlpatterns = [
    path('register/', UserCreateView.as_view(), name='user-register'),
    path('profile/', UserProfileDetailView.as_view(), name='user-profile-detail'),
    path('profile/create/', UserProfileCreateView.as_view(), name='user-profile-create'),
]
