# 4. Chat Module

This guide will walk you through creating a simple chat module in a Django project. It's designed for beginners, so we'll explain each step in detail.

---

## 1. Create the Chat App

First, create a new Django app called `chat`. Open your terminal and run:

```shell
docker-compose exec web python manage.py startapp chat
```

**Explanation**:

- `docker-compose exec web`: Runs a command in the `web` service defined in your `docker-compose.yml`.
- `python manage.py startapp chat`: Creates a new Django app named `chat`.

---

## 2. Define the Models

We'll create two models:

- `Conversation`: Represents a chat conversation between users.
- `ConversationMessage`: Represents messages sent within a conversation.

### Edit `chat/models.py`

Replace the contents of `chat/models.py` with the following code:

```python
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    users = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        usernames = ', '.join([user.username for user in self.users.all()])
        return f"Conversation between {usernames}"

class ConversationMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    body = models.TextField()
    sent_to = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.created_by.username} to {self.sent_to.username}"
```

**Explanation**:

- **UUIDField**: We use `UUIDField` for primary keys to ensure unique identifiers.
- **get_user_model()**: Fetches the User model, supporting custom user models.
- **Conversation Model**:
    - `users`: Many-to-Many relationship with `User`.
    - `created_at`, `modified_at`: Timestamps for record creation and updates.
- **ConversationMessage Model**:
    - `conversation`: ForeignKey to `Conversation`.
    - `body`: Text of the message.
    - `sent_to`, `created_by`: ForeignKeys to `User`.
    - `created_at`: Timestamp for message creation.
- **__str__ Methods**: Provide readable representations for the models, helpful in the admin interface.

---

## 3. Configure Project Settings

We need to tell Django about our new `chat` app.

### Edit `djangobnb_backend/settings.py`

Add `'chat',` to the `INSTALLED_APPS` list:

```python
INSTALLED_APPS = [
    # Other installed apps...
    'chat',
]
```

**Explanation**:

- This registers the `chat` app with your Django project, so it recognizes the models and other components.

### Edit `djangobnb_backend/urls.py`

Include the `chat` app's URLs in your project's main URL configuration:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing URL patterns ...
    path('api/chat/', include('chat.urls')),
]
```

**Explanation**:

- This routes any URLs starting with `api/chat/` to the `chat` app's URL configurations.

---

## 4. Configure the Chat App

### Edit `chat/admin.py`

Register your models with the Django admin site:

```python
from django.contrib import admin
from .models import Conversation, ConversationMessage

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'modified_at')
    filter_horizontal = ('users',)

@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'created_by', 'sent_to', 'created_at')
    search_fields = ('body',)
    list_filter = ('created_at',)
```

**Explanation**:

- **@admin.register**: Decorator to register the models with the admin site.
- **ConversationAdmin**:
    - `list_display`: Fields to display in the admin list view.
    - `filter_horizontal`: Provides a better UI for the ManyToMany `users` field.
- **ConversationMessageAdmin**:
    - `list_display`: Fields for the message list view.
    - `search_fields`: Enables searching messages by `body`.
    - `list_filter`: Allows filtering messages by `created_at`.

---

## 5. Create the API

Create `api.py`, `serializers.py`, and `urls.py` in the `chat` app to define API endpoints.

### 1. Conversation List API

This endpoint provides a list of conversations for the authenticated user.

#### Edit `chat/serializers.py`

```python
from rest_framework import serializers
from .models import Conversation, ConversationMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')

class ConversationListSerializer(serializers.ModelSerializer):
    users = UserDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'users', 'modified_at')
```

**Explanation**:

- **UserDetailSerializer**: Serializes basic user information.
- **ConversationListSerializer**: Includes users in each conversation.

#### Edit `chat/api.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Conversation
from .serializers import ConversationListSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_list(request):
    conversations = request.user.conversations.all()
    serializer = ConversationListSerializer(conversations, many=True)
    return Response(serializer.data)
```

**Explanation**:

- **@api_view(['GET'])**: Specifies that this view handles GET requests.
- **@permission_classes([IsAuthenticated])**: Ensures only authenticated users can access the view.
- **request.user.conversations.all()**: Retrieves all conversations involving the authenticated user.

#### Edit `chat/urls.py`

```python
from django.urls import path
from . import api

urlpatterns = [
    path('', api.conversations_list, name='api_conversations_list'),
]
```

### 2. Conversation Detail API

This endpoint retrieves details of a specific conversation, including messages.

#### Edit `chat/serializers.py`

Add the following serializers:

```python
class ConversationMessageSerializer(serializers.ModelSerializer):
    sent_to = UserDetailSerializer(read_only=True)
    created_by = UserDetailSerializer(read_only=True)

    class Meta:
        model = ConversationMessage
        fields = ('id', 'body', 'sent_to', 'created_by', 'created_at')

class ConversationDetailSerializer(serializers.ModelSerializer):
    users = UserDetailSerializer(many=True, read_only=True)
    messages = ConversationMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'users', 'modified_at', 'messages')
```

**Explanation**:

- **ConversationMessageSerializer**: Serializes individual messages.
- **ConversationDetailSerializer**: Includes messages in the conversation.

#### Edit `chat/api.py`

Add the conversation detail view:

```python
from django.shortcuts import get_object_or_404

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_detail(request, pk):
    conversation = get_object_or_404(Conversation, pk=pk, users=request.user)
    serializer = ConversationDetailSerializer(conversation)
    return Response(serializer.data)
```

**Explanation**:

- **get_object_or_404**: Fetches the conversation or returns a 404 if not found.
- **users=request.user**: Ensures the authenticated user is part of the conversation.

#### Edit `chat/urls.py`

Add the URL pattern:

```python
urlpatterns = [
    path('', api.conversations_list, name='api_conversations_list'),
    path('<uuid:pk>/', api.conversations_detail, name='api_conversations_detail'),
]
```

### 3. Conversation Start API

This endpoint allows a user to start a new conversation or retrieve an existing one with another user.

#### Edit `chat/api.py`

Add the conversation start view:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversations_start(request, user_id):
    other_user = get_object_or_404(User, pk=user_id)
    conversations = Conversation.objects.filter(users=request.user).filter(users=other_user)

    if conversations.exists():
        conversation = conversations.first()
    else:
        conversation = Conversation.objects.create()
        conversation.users.add(request.user, other_user)

    serializer = ConversationDetailSerializer(conversation)
    return Response(serializer.data)
```

**Explanation**:

- **other_user**: The user with whom the conversation is started.
- **conversations.exists()**: Checks if a conversation already exists between the two users.
- **conversation.users.add()**: Adds both users to the conversation.

#### Edit `chat/urls.py`

Add the URL pattern:

```python
urlpatterns = [
    path('', api.conversations_list, name='api_conversations_list'),
    path('start/<int:user_id>/', api.conversations_start, name='api_conversations_start'),
    path('<uuid:pk>/', api.conversations_detail, name='api_conversations_detail'),
]
```

---

## 6. Run Migrations

Apply the migrations to create the necessary database tables:

```shell
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

**Explanation**:

- **makemigrations**: Creates migration files based on changes to models.
- **migrate**: Applies the migrations to the database.