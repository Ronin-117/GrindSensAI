from django.urls import path
from . import views 
from .views import UserCreateView

urlpatterns = [
    #path('', views.index, name='index'),
    path('register/', UserCreateView.as_view(), name='user-register'),
]
