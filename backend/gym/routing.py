# myapp/routing.py
from django.urls import re_path
from . import consumers 

websocket_urlpatterns = [
    re_path(r'ws/supervision/(?P<exercise_id>\w+)/$', consumers.SupervisionConsumer.as_asgi()),
]