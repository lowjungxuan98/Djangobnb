# 4. WebSockets Features

## 1. Configure Chat App


### i. Create `chat/consumers.py`
- A consumer handles WebSocket connections similarly to how a view handles HTTP requests.

```python
import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import ConversationMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def websocket_connect(self, event):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        conversation_id = data["data"].get("conversation_id")
        sent_to_id = data["data"].get("sent_to_id")
        name = data["data"].get("name")
        body = data["data"].get("body")

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "body": body,
                "name": name
            }
        )

        # Save message to the database
        await self.save_message(conversation_id, body, sent_to_id)

    # Receive message from room group
    async def chat_message(self, event):
        body = event["body"]
        name = event["name"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "body": body,
            "name": name
        }))

    @sync_to_async
    def save_message(self, conversation_id, body, sent_to_id):
        user = self.scope["user"]

        ConversationMessage.objects.create(
            conversation_id=conversation_id,
            body=body,
            sent_to_id=sent_to_id,
            created_by=user
        )
```

**Explanation**:

- **websocket_connect**: Called when a WebSocket connection is established.
  - Retrieves the `room_name` from the URL.
  - Joins the channel layer group corresponding to the room.
- **disconnect**: Called when the WebSocket connection is closed.
  - Removes the user from the room group.
- **receive**: Handles incoming messages.
  - Parses the JSON data received.
  - Broadcasts the message to the room group.
  - Saves the message to the database.
- **chat_message**: Receives messages from the room group and sends them to the WebSocket client.
- **save_message**: Synchronously saves the message to the database.

### ii. Create `chat/routing.py`
- We need to route WebSocket URLs to our consumer.

```python
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/<str:room_name>/', consumers.ChatConsumer.as_asgi()),
]
```

**Explanation**:

- Defines a URL pattern for WebSocket connections.
- Routes `ws/<room_name>/` to `ChatConsumer`.

### iii. Create `chat/token_auth.py`
- Since WebSockets don't support traditional session-based authentication, we'll implement token-based authentication.

```python
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from useraccount.models import User

@database_sync_to_async
def get_user(token_key):
    try:
        token = AccessToken(token_key)
        user_id = token.payload['user_id']
        return User.objects.get(pk=user_id)
    except Exception:
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope['query_string'].decode()
        query_params = dict(x.split('=') for x in query_string.split("&") if '=' in x)
        token_key = query_params.get('token')

        scope['user'] = await get_user(token_key)
        return await super().__call__(scope, receive, send)
```

**Explanation**:

- **get_user**: Retrieves the user associated with the token.
- **TokenAuthMiddleware**: Custom middleware to authenticate users.
  - Parses the token from the query string.
  - Adds the user to the `scope`.

---

## 2. Configure Project

### i. Edit `djangobnb_backend/asgi.py`
- Update your ASGI application to handle WebSocket connections.


```python
import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from chat import routing
from chat.token_auth import TokenAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djangobnb_backend.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': TokenAuthMiddleware(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})
```

**Explanation**:

- **ProtocolTypeRouter**: Routes requests based on their protocol (HTTP or WebSocket).
- **TokenAuthMiddleware**: Applies our custom authentication middleware to WebSocket connections.
- **URLRouter**: Routes WebSocket URLs to the appropriate consumers.

### ii. Edit `djangobnb_backend/settings.py`
- Configure Django Channels in your project settings.

```python
# Add Daphne and Channels to INSTALLED_APPS
INSTALLED_APPS = [
    'daphne',
    'channels',
    # ... other apps ...
]

# Define ASGI application
ASGI_APPLICATION = 'djangobnb_backend.asgi.application'

# Configure Channel Layers
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# WSGI application remains the same
WSGI_APPLICATION = 'djangobnb_backend.wsgi.application'
```

**Explanation**:

- **INSTALLED_APPS**: Adds `daphne` and `channels`.
- **ASGI_APPLICATION**: Points to our ASGI application.
- **CHANNEL_LAYERS**: Configures the channel layer. Here, we're using an in-memory layer for simplicity. For production, consider using Redis.
- **WSGI_APPLICATION**: Remains unchanged for handling traditional HTTP requests.

---

## 3. Run Migrations

Apply migrations to update your database schema.

```shell
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

**Explanation**:

- **makemigrations**: Detects changes to models and creates migration files.
- **migrate**: Applies migrations to the database.

### Additional Explanations

#### Why Use In-Memory Channel Layer?

- **In-Memory Layer**: Suitable for development and testing.
- **Limitations**: Doesn't support multiple instances. For production, use Redis or another robust backend.

### Token-Based Authentication in WebSockets

- **Challenge**: WebSockets don't send cookies or headers in the same way as HTTP requests.
- **Solution**: Pass the token in the query string and authenticate during the connection setup.

---

**Happy Coding!**

---