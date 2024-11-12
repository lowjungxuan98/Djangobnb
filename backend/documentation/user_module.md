# 2. User Module

## 1. Create the App

First, create a new Django app called `useraccount`:

```shell
docker-compose exec web python manage.py startapp useraccount
```

---

## 2. Define the Model

In the `useraccount/models.py` file to define a custom user model:

```python
import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager
from django.db import models

class CustomUserManager(UserManager):
    def _create_user(self, name, email, password, **extra_fields):
        if not email:
            raise ValueError("You have not specified a valid e-mail address")

        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)  # Note: Use self._db instead of self.db

        return user

    def create_user(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(name, email, password, **extra_fields)

    def create_superuser(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(name, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to='uploads/avatars', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def avatar_url(self):
        if self.avatar:
            return f'{settings.WEBSITE_URL}{self.avatar.url}'
        else:
            return ''
```

- **Explanation**:
   - **Imports**:
      - `uuid`: For generating unique user IDs.
      - Django modules for settings, authentication, and models.
   - **CustomUserManager**:
      - Inherits from `UserManager` to manage user creation.
      - `_create_user`: Internal method to create and save a user with the given email and password.
         - Checks if an email is provided.
         - Normalizes the email address.
         - Creates a user instance and saves it.
      - `create_user`: Creates a regular user.
         - Sets `is_staff` and `is_superuser` to `False`.
      - `create_superuser`: Creates a superuser.
         - Sets `is_staff` and `is_superuser` to `True`.
   - **User Model**:
      - Inherits from `AbstractBaseUser` and `PermissionsMixin`.
      - Fields:
         - `id`: UUID field as the primary key.
         - `email`: Unique email address.
         - `name`: Optional name field.
         - `avatar`: Image field for user profile pictures.
         - `is_active`, `is_superuser`, `is_staff`: Boolean fields for user status.
         - `date_joined`, `last_login`: Timestamp fields.
      - `objects`: Uses `CustomUserManager` for user management.
      - `USERNAME_FIELD`: Specifies `email` as the unique identifier for authentication.
      - `REQUIRED_FIELDS`: Additional required fields when creating a superuser.
      - `avatar_url`: Method to return the full URL of the user's avatar.

---

## 3. Configure Project Settings

Edit your project's `settings.py` to integrate the custom user model and other configurations.

### Edit `djangobnb_backend/settings.py`

```python
# djangobnb_backend/settings.py

from datetime import timedelta
import os

# Existing imports...

# Custom User Model
AUTH_USER_MODEL = 'useraccount.User'

# Site Configuration
SITE_ID = 1
WEBSITE_URL = 'http://localhost:8000'

# JWT Authentication Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKEN": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
    "SIGNING_KEY": "acomplexkey",
    "ALGORITHM": "HS512",
}

# Allauth Configuration
ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = "none"

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000',
]

# dj-rest-auth Configuration
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": False,
}

# Installed Applications
INSTALLED_APPS = [
    # ... existing apps ...
    'django.contrib.sites',

    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    
    'allauth',
    'allauth.account',
    'allauth.socialaccount',        

    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    'corsheaders',

    'useraccount',
    # ... other apps ...
]

# Middleware Configuration
MIDDLEWARE = [
    # Existing middleware...
    'corsheaders.middleware.CorsMiddleware',
    # Other middleware...
]

# Media Files Configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

- **Explanation**:
   - **Custom User Model**:
      - `AUTH_USER_MODEL`: Tells Django to use your custom user model.
   - **Site Configuration**:
      - `SITE_ID`: Required by `django-allauth`.
      - `WEBSITE_URL`: Base URL for constructing full URLs.
   - **JWT Authentication Settings**:
      - Configures JWT token lifetimes and algorithms.
      - `SIMPLE_JWT`: Settings for the `rest_framework_simplejwt` package.
   - **Allauth Configuration**:
      - Disables username fields and requires email for authentication.
      - `ACCOUNT_*` settings customize the behavior of `django-allauth`.
   - **REST Framework Configuration**:
      - Sets default authentication and permission classes.
      - Uses JWT authentication.
   - **CORS Configuration**:
      - `CORS_ALLOWED_ORIGINS`: Specifies which origins are allowed to make cross-origin requests.
   - **dj-rest-auth Configuration**:
      - `REST_AUTH`: Configures `dj-rest-auth` to use JWT.
   - **Installed Applications**:
      - Adds necessary apps for REST API, authentication, and CORS handling.
      - Includes your `useraccount` app.
   - **Middleware Configuration**:
      - Adds `CorsMiddleware` to handle CORS headers.
      - Adds `AccountMiddleware` from `django-allauth`.
   - **Media Files Configuration**:
      - Sets up media URL and root directory for user-uploaded files.

### Edit `djangobnb_backend/urls.py`

Include the `useraccount` app URLs in your project's main URL configuration:

```python
from django.urls import path, include

urlpatterns = [
    # ... existing URL patterns ...
    path('api/auth/', include('useraccount.urls')),
]
```

---

## 4. Create API

Create `api.py`, `serializers.py`, and `urls.py` in the `useraccount` app to define API endpoints for user authentication and data retrieval.

### 1. Register API

#### Edit `useraccount/urls.py`

```python
# useraccount/urls.py

from django.urls import path
from dj_rest_auth.registration.views import RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="rest_register"),
]
```

### 2. Login API

#### Edit `useraccount/urls.py`

```python
from dj_rest_auth.views import LoginView

urlpatterns = [
    ...,
    path("login/", LoginView.as_view(), name="rest_login"),
]
```

### 3. Logout API

#### Edit `useraccount/urls.py`

```python
from dj_rest_auth.views import LogoutView

urlpatterns = [
    ...,
    path("logout/", LogoutView.as_view(), name="rest_logout"),
]
```

### 4. Token Refresh

#### Edit `useraccount/urls.py`

```python
from dj_rest_auth.jwt_auth import get_refresh_view

urlpatterns = [
    ...,
    path("token/refresh/", get_refresh_view().as_view(), name="token_refresh"),
]
```

### 5. Landlord Detail

Retrieve the details of a landlord (user).

#### Edit `useraccount/serializers.py`

```python
# useraccount/serializers.py

from rest_framework import serializers
from .models import User

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'avatar_url')
```

#### Edit `useraccount/api.py`

```python
# useraccount/api.py

from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.http import JsonResponse
from .models import User
from .serializers import UserDetailSerializer

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def landlord_detail(request, pk):
    try:
        user = User.objects.get(pk=pk)
        serializer = UserDetailSerializer(user)
        return JsonResponse(serializer.data, safe=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
```

#### Edit `useraccount/urls.py`

```python
from . import api

urlpatterns = [
    ...,
    path("<uuid:pk>/", api.landlord_detail, name="api_landlord_detail"),
]
```

### 6. Reservation List

Retrieve the list of reservations made by the user.

**Note**: This API **REQUIRED** the **Property Module** to be set up; otherwise, it will cause an error.

#### Edit `useraccount/api.py`

```python
from rest_framework.decorators import api_view
from django.http import JsonResponse
# from .serializers import ReservationsListSerializer  # Ensure this serializer exists

@api_view(['GET'])
def reservations_list(request):
    reservations = request.user.reservations.all()

    print('user', request.user)
    print(reservations)
    
    serializer = ReservationsListSerializer(reservations, many=True)
    return JsonResponse(serializer.data, safe=False)
```

#### Edit `useraccount/urls.py`

```python
urlpatterns = [
    ...,
    path("myreservations/", api.reservations_list, name="api_reservations_list"),
]
```

**Notes:**

- Ensure that you have a `ReservationsListSerializer` defined.
- The `reservations` field should be properly related in your user model or related models.

---

## 5. Migration

Apply the migrations to create the necessary database tables:

```shell
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

---

## 6. Create Super User

Create a superuser account to access the Django admin site:

```shell
docker-compose exec web python manage.py createsuperuser
```

Follow the prompts to set up your superuser credentials.

---

## 7. Access the Admin Site

You can now log in to the Django admin interface using the superuser account:

- **URL**: [http://localhost:8000/admin](http://localhost:8000/admin)