# gym/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import gym.routing # We will create this file next

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(), # Handles standard HTTP requests
    "websocket": AuthMiddlewareStack( # Handles WebSocket, AuthMiddlewareStack makes user available
        URLRouter(
            gym.routing.websocket_urlpatterns # Points to your app's WebSocket URL patterns
        )
    ),
})