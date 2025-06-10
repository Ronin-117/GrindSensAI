# myapp/routing.py
from django.urls import re_path
from . import consumers # We will create consumers.py next

websocket_urlpatterns = [
    re_path(r'ws/supervision/(?P<exercise_id>\w+)/$', consumers.SupervisionConsumer.as_asgi()),
    # The exercise_id can be the original_exercise_id from your LoggedExercise
]