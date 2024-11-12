# 3. Property Module

This guide will help you set up the **Property Module** in your Django project. You'll create a new app, define models, configure project settings, register models in the admin site, create forms, develop APIs, set up serializers, configure URLs, and run migrations. This guide follows the sequence provided and includes explanations suitable for Django beginners.

---

## 1. Create the App

First, create a new Django app called `property`:

```shell
docker-compose exec web python manage.py startapp property
```

---

## 2. Define the Model

In the `property/models.py` file, define the models for the Property module:

```python
import uuid
from django.conf import settings
from django.db import models
from useraccount.models import User

class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price_per_night = models.IntegerField()
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    guests = models.IntegerField()
    country = models.CharField(max_length=255)
    country_code = models.CharField(max_length=10)
    category = models.CharField(max_length=255)
    favorited = models.ManyToManyField(User, related_name="favorites", blank=True)
    image = models.ImageField(upload_to="uploads/properties")
    landlord = models.ForeignKey(
        User, related_name="properties", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def image_url(self):
        return f"{settings.WEBSITE_URL}{self.image.url}"

class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, related_name="reservations", on_delete=models.CASCADE
    )
    start_date = models.DateField()
    end_date = models.DateField()
    number_of_nights = models.IntegerField()
    guests = models.IntegerField()
    total_price = models.FloatField()
    created_by = models.ForeignKey(
        User, related_name="reservations", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
```

**Explanation**:

- **Imports**:
    - `uuid`: For generating unique IDs.
    - `settings`: To access project settings.
    - `models`: Django's model base class.
    - `User`: Custom user model from the `useraccount` app.

- **Property Model**:
    - **Fields**:
        - `id`: UUID primary key.
        - `title`, `description`: Property details.
        - `price_per_night`: Rental price per night.
        - `bedrooms`, `bathrooms`, `guests`: Property specifications.
        - `country`, `country_code`: Location information.
        - `category`: Property category.
        - `favorited`: Many-to-many relationship with `User` for favorite properties.
        - `image`: Image of the property.
        - `landlord`: Foreign key to the `User` model representing the property owner.
        - `created_at`: Timestamp when the property was added.
    - **Methods**:
        - `image_url`: Returns the full URL of the property's image.

- **Reservation Model**:
    - **Fields**:
        - `id`: UUID primary key.
        - `property`: Foreign key to the `Property` model.
        - `start_date`, `end_date`: Reservation dates.
        - `number_of_nights`: Duration of the stay.
        - `guests`: Number of guests.
        - `total_price`: Total price of the reservation.
        - `created_by`: Foreign key to the `User` model representing the guest.
        - `created_at`: Timestamp when the reservation was made.

---

## 3. Configure Project Settings

### Edit `djangobnb_backend/settings.py`

Add the `property` app to your `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # Other installed apps...
    'property',
]
```

**Explanation**:

- Registers the `property` app with your Django project.

### Edit `djangobnb_backend/urls.py`

Include the `property` app URLs in your project's main URL configuration:

```python
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include

urlpatterns = [
    # ... existing URL patterns ...
    path('api/properties/', include('property.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Explanation**:

- Includes the `property` app URLs under the `api/properties/` path.
- Serves media files during development.

---

## 4. Configure App Settings

### Edit `property/admin.py`

Register your models with the Django admin site:

```python
from django.contrib import admin
from .models import Property, Reservation

# Register your models here.
admin.site.register(Property)
admin.site.register(Reservation)
```

**Explanation**:

- Allows you to manage `Property` and `Reservation` models via the Django admin interface.

---

## 5. Create API

Create `api.py`, `forms.py`, `serializers.py`, and `urls.py` in the `property` app to define API endpoints.

### 1. Property List API

#### Edit `property/serializers.py`

```python
from rest_framework import serializers
from .models import Property

class PropertiesListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = (
            "id",
            "title",
            "price_per_night",
            "image_url",
        )
```

**Explanation**:

- Serializes the `Property` model for listing properties.
- Includes `id`, `title`, `price_per_night`, and `image_url`.

#### Edit `property/api.py`

```python
from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.tokens import AccessToken
from .forms import PropertyForm
from .models import Property, Reservation
from .serializers import PropertiesListSerializer, PropertiesDetailSerializer, ReservationsListSerializer
from useraccount.models import User

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def properties_list(request):
    #
    # Auth

    try:
        token = request.META['HTTP_AUTHORIZATION'].split('Bearer ')[1]
        token = AccessToken(token)
        user_id = token.payload['user_id']
        user = User.objects.get(pk=user_id)
    except Exception as e:
        user = None

    #
    #

    favorites = []
    properties = Property.objects.all()

    #
    # Filter

    is_favorites = request.GET.get('is_favorites', '')
    landlord_id = request.GET.get('landlord_id', '')

    country = request.GET.get('country', '')
    category = request.GET.get('category', '')
    checkin_date = request.GET.get('checkIn', '')
    checkout_date = request.GET.get('checkOut', '')
    bedrooms = request.GET.get('numBedrooms', '')
    guests = request.GET.get('numGuests', '')
    bathrooms = request.GET.get('numBathrooms', '')

    print('country', country)

    if checkin_date and checkout_date:
        exact_matches = Reservation.objects.filter(start_date=checkin_date) | Reservation.objects.filter(end_date=checkout_date)
        overlap_matches = Reservation.objects.filter(start_date__lte=checkout_date, end_date__gte=checkin_date)
        all_matches = []

        for reservation in exact_matches | overlap_matches:
            all_matches.append(reservation.property_id)
        
        properties = properties.exclude(id__in=all_matches)

    if landlord_id:
        properties = properties.filter(landlord_id=landlord_id)

    if is_favorites:
        properties = properties.filter(favorited__in=[user])
    
    if guests:
        properties = properties.filter(guests__gte=guests)
    
    if bedrooms:
        properties = properties.filter(bedrooms__gte=bedrooms)
    
    if bathrooms:
        properties = properties.filter(bathrooms__gte=bathrooms)
    
    if country:
        properties = properties.filter(country=country)
    
    if category and category != 'undefined':
        properties = properties.filter(category=category)
    
    #
    # Favorites
        
    if user:
        for property in properties:
            if user in property.favorited.all():
                favorites.append(property.id)

    #
    #

    serializer = PropertiesListSerializer(properties, many=True)

    return JsonResponse({
        'data': serializer.data,
        'favorites': favorites
    })
```

**Explanation**:

- **Authentication**:
    - Tries to retrieve the user from the JWT token.
    - If authentication fails, `user` is set to `None`.

- **Filtering**:
    - Supports filtering properties based on query parameters like `is_favorites`, `landlord_id`, `country`, `category`, `checkIn`, `checkOut`, `numBedrooms`, `numGuests`, and `numBathrooms`.
    - Excludes properties that are already booked for the given dates.

- **Favorites**:
    - Determines which properties are favorited by the user.

- **Response**:
    - Serializes the properties using `PropertiesListSerializer`.
    - Returns the data along with a list of favorite property IDs.

#### Edit `property/urls.py`

```python
from django.urls import path
from . import api

urlpatterns = [
    path("", api.properties_list, name="api_properties_list"),
]
```

**Explanation**:

- Defines the URL pattern for the properties list API.

---

### 2. Add Property API

#### Edit `property/forms.py`

```python
from django.forms import ModelForm
from .models import Property

class PropertyForm(ModelForm):
    class Meta:
        model = Property
        fields = (
            'title',
            'description',
            'price_per_night',
            'bedrooms',
            'bathrooms',
            'guests',
            'country',
            'country_code',
            'category',
            'image',
        )
```

**Explanation**:

- `PropertyForm` is a `ModelForm` for creating new `Property` instances.
- Includes necessary fields for property creation.

#### Edit `property/api.py`

```python
@api_view(['POST', 'FILES'])
def create_property(request):
    form = PropertyForm(request.POST, request.FILES)

    if form.is_valid():
        property = form.save(commit=False)
        property.landlord = request.user
        property.save()

        return JsonResponse({'success': True})
    else:
        print('error', form.errors, form.non_field_errors)
        return JsonResponse({'errors': form.errors.as_json()}, status=400)
```

**Explanation**:

- Handles POST requests to create a new property.
- Validates the data using `PropertyForm`.
- Assigns the current user as the landlord.
- Returns a success or error message.

#### Edit `property/urls.py`

```python
urlpatterns = [
    # ... existing URL patterns ...
    path("create/", api.create_property, name="api_create_property"),
]
```

**Explanation**:

- Adds the URL pattern for the create property API.

---

### 3. Property Detail API

#### Edit `property/serializers.py`

```python
from useraccount.serializers import UserDetailSerializer

class PropertiesDetailSerializer(serializers.ModelSerializer):
    landlord = UserDetailSerializer(read_only=True, many=False)

    class Meta:
        model = Property
        fields = (
            "id",
            "title",
            "description",
            "price_per_night",
            "image_url",
            "bedrooms",
            "bathrooms",
            "guests",
            "landlord",
        )
```

**Explanation**:

- Serializes detailed property information, including landlord details.

#### Edit `property/api.py`

```python
@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def properties_detail(request, pk):
    property = Property.objects.get(pk=pk)

    serializer = PropertiesDetailSerializer(property, many=False)

    return JsonResponse(serializer.data)
```

**Explanation**:

- Retrieves a specific property by ID.
- Serializes the property using `PropertiesDetailSerializer`.
- Returns the property data.

#### Edit `property/urls.py`

```python
urlpatterns = [
    # ... existing URL patterns ...
    path("<uuid:pk>/", api.properties_detail, name="api_properties_detail"),
]
```

**Explanation**:

- Adds the URL pattern for the property detail API.

---

### 4. Book Property API

#### Edit `property/api.py`

```python
@api_view(['POST'])
def book_property(request, pk):
    try:
        start_date = request.POST.get('start_date', '')
        end_date = request.POST.get('end_date', '')
        number_of_nights = request.POST.get('number_of_nights', '')
        total_price = request.POST.get('total_price', '')
        guests = request.POST.get('guests', '')

        property = Property.objects.get(pk=pk)

        Reservation.objects.create(
            property=property,
            start_date=start_date,
            end_date=end_date,
            number_of_nights=number_of_nights,
            total_price=total_price,
            guests=guests,
            created_by=request.user
        )

        return JsonResponse({'success': True})
    except Exception as e:
        print('Error', e)
        return JsonResponse({'success': False})
```

**Explanation**:

- Handles POST requests to book a property.
- Creates a new `Reservation` instance.
- Returns a success or failure message.

#### Edit `property/urls.py`

```python
urlpatterns = [
    # ... existing URL patterns ...
    path("<uuid:pk>/book/", api.book_property, name="api_book_property"),
]
```

**Explanation**:

- Adds the URL pattern for the book property API.

---

### 5. Property Reservation List API

#### Edit `property/serializers.py`

```python
class ReservationsListSerializer(serializers.ModelSerializer):
    property = PropertiesListSerializer(read_only=True, many=False)

    class Meta:
        model = Reservation
        fields = (
            "id",
            "start_date",
            "end_date",
            "number_of_nights",
            "total_price",
            "property",
        )
```

**Explanation**:

- Serializes reservation data, including property details.

#### Edit `property/api.py`

```python
@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def property_reservations(request, pk):
    property = Property.objects.get(pk=pk)
    reservations = property.reservations.all()

    serializer = ReservationsListSerializer(reservations, many=True)

    return JsonResponse(serializer.data, safe=False)
```

**Explanation**:

- Retrieves all reservations for a specific property.
- Returns serialized reservation data.

#### Edit `property/urls.py`

```python
from . import api

urlpatterns = [
    # ... existing URL patterns ...
    path(
        "<uuid:pk>/reservations/",
        api.property_reservations,
        name="api_property_reservations",
    ),
]
```

**Explanation**:

- Adds the URL pattern for the property reservations API.

---

### 6. Toggle Favorite API

#### Edit `property/api.py`

```python
@api_view(['POST'])
def toggle_favorite(request, pk):
    property = Property.objects.get(pk=pk)

    if request.user in property.favorited.all():
        property.favorited.remove(request.user)

        return JsonResponse({'is_favorite': False})
    else:
        property.favorited.add(request.user)

        return JsonResponse({'is_favorite': True})
```

**Explanation**:

- Allows users to add or remove a property from their favorites.
- Updates the `favorited` relationship accordingly.
- Returns the new favorite status.

#### Edit `property/urls.py`

```python
urlpatterns = [
    # ... existing URL patterns ...
    path("<uuid:pk>/toggle_favorite/", api.toggle_favorite, name="api_toggle_favorite"),
]
```

**Explanation**:

- Adds the URL pattern for the toggle favorite API.

---

## 6. Migration

Apply the migrations to create the necessary database tables:

```shell
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

**Explanation**:

- `makemigrations`: Detects changes in models and creates migration files.
- `migrate`: Applies migrations to the database.