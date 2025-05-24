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


