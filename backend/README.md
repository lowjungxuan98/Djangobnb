# 1. Project Setup

In this guide, we'll walk through setting up a Django project with Docker and PostgreSQL. This tutorial is tailored for beginners to help you understand each step of the configuration process.

## i. Project Configuration

### Step 1: Create Project Directories

First, create a directory for your backend and navigate into it:

```bash
   mkdir backend
   cd backend
   mkdir djangobnb_backend
   cd djangobnb_backend
```

### Step 2: Set Up a Virtual Environment

Create a virtual environment to manage your project's dependencies:

```bash
   python3 -m venv env
   source env/bin/activate
```

- **Explanation**:
   - `python3 -m venv env` creates a virtual environment named `env`.
   - `source env/bin/activate` activates the virtual environment.

### Step 3: Install Django

Install Django using pip:

```bash
  pip install django
```

### Step 4: Start a New Django Project

Initialize a new Django project in the current directory:

```bash
  django-admin startproject djangobnb_backend .
```

- **Note**: The dot `.` specifies that the project should be created in the current directory.

### Step 5: Create a Requirements File

Create a `requirements.txt` file to list your project's dependencies:

```bash
  touch requirements.txt
```

Add the following content to `requirements.txt`:

```
Django
psycopg2-binary
dj-rest-auth
django-allauth
django-cors-headers
djangorestframework
djangorestframework-simplejwt
pillow
channels
daphne
gunicorn
python-dotenv
requests
```

- **Explanation**:
   - Each line represents a Python package that your project requires.
   - These packages include Django, database adapters, authentication tools, and more.

### Step 6: Create an Entrypoint Script

Create an `entrypoint.sh` script to manage Docker's startup process:

```bash
  touch entrypoint.sh
```

Add the following content to `entrypoint.sh`:

```shell
   #!/bin/sh
   
   if [ "$DATABASE" = "postgres" ] 
   then
       echo "Check if database is running..."
   
       while ! nc -z $SQL_HOST $SQL_PORT; do
           sleep 0.1
       done
   
       echo "The database is up and running :-D"
   fi
   
   python manage.py makemigrations
   python manage.py migrate
   
   exec "$@"
```

- **Explanation**:
   - This script checks if the PostgreSQL database is ready before running migrations.
   - `nc -z $SQL_HOST $SQL_PORT` checks the network connection to the database.
   - `exec "$@"` executes the command passed to the Docker container.

## ii. Setup Docker Environment

### Step 1: Create a Dockerfile

Create a `Dockerfile` to define your Docker image:

```bash
  touch Dockerfile
```

Add the following content to the `Dockerfile`:

```dockerfile
FROM python

WORKDIR /usr/src/djangobnb_backend

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y netcat-traditional

RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

COPY ./entrypoint.sh .
RUN sed -i 's/\r$//g' /usr/src/djangobnb_backend/entrypoint.sh
RUN chmod +x /usr/src/djangobnb_backend/entrypoint.sh

COPY . .

ENTRYPOINT [ "/usr/src/djangobnb_backend/entrypoint.sh" ]
```

- **Explanation**:
   - `FROM python`: Uses the latest Python Docker image as the base.
   - `WORKDIR`: Sets the working directory inside the container.
   - `ENV` variables prevent Python from creating `.pyc` files and enable output buffering.
   - `RUN` commands update the package list, install necessary packages, and install Python dependencies.
   - `COPY` commands copy files from your local machine to the Docker image.
   - `ENTRYPOINT` specifies the script that runs when the container starts.

### Step 2: Create a Docker Compose File

Navigate back to the `backend` directory:

```bash
  cd ..
  touch docker-compose.yml
```

Add the following content to `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build: ./djangobnb_backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./djangobnb_backend/:/usr/src/djangobnb_backend/
    ports:
      - 8000:8000
    env_file:
      - ./.env.dev
    depends_on:
      - db
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    environment:
      - POSTGRES_USER=postgresuser
      - POSTGRES_PASSWORD=postgrespassword
      - POSTGRES_DB=djangobnb

volumes:
  postgres_data:
```

- **Explanation**:
   - `version`: Specifies the Docker Compose file version.
   - `services`: Defines the services (containers) to run.
      - `web`: Your Django application.
         - `build`: Builds the Docker image from the specified directory.
         - `command`: Runs the Django development server.
         - `volumes`: Mounts your local code into the container for live updates.
         - `ports`: Exposes port 8000 to access the app.
         - `env_file`: Points to your environment variables file.
         - `depends_on`: Ensures the database service starts before the web service.
      - `db`: The PostgreSQL database service.
         - `image`: Specifies the PostgreSQL Docker image version.
         - `volumes`: Mounts a volume for persistent data storage.
         - `environment`: Sets database credentials.
   - `volumes`: Defines named volumes for data persistence.

## iii. Connect Postgres

### Step 1: Update Django Settings

Edit your `djangobnb_backend/settings.py` file to configure the database connection:

```python
import os

SECRET_KEY = os.environ.get("SECRET_KEY")

DEBUG = bool(os.environ.get("DEBUG", default=0))

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS").split(" ")

DATABASES = {
    'default': {
        'ENGINE': os.environ.get("SQL_ENGINE"),
        'NAME': os.environ.get("SQL_DATABASE"),
        'USER': os.environ.get("SQL_USER"),
        'PASSWORD': os.environ.get("SQL_PASSWORD"),
        'HOST': os.environ.get("SQL_HOST"),
        'PORT': os.environ.get("SQL_PORT"),
    }
}
```

- **Explanation**:
   - `SECRET_KEY`: Retrieves the secret key from environment variables.
   - `DEBUG`: Sets the debug mode based on the environment variable.
   - `ALLOWED_HOSTS`: Defines allowed hosts for the application.
   - `DATABASES`: Configures the database connection using environment variables.

### Step 2: Build and Run Your Docker Containers

Run the following command to build and start your Docker containers:

```bash
  docker-compose up --build
```

- **Explanation**:
   - `docker-compose up`: Starts all services defined in your `docker-compose.yml` file.
   - `--build`: Forces a rebuild of the Docker images.

# [2. User Module](../backend/documentation/user_module.md)
# [3. Property Module](../backend/documentation/property_module.md)
# [4. Chat Module](../backend/documentation/chat_module.md)
# [5. WebSocket Feature](../backend/documentation/websocket_module.md)

temp
```shell
cd backend/djangobnb_backend 
   source env/bin/activate
```
brew install sshpass

sshpass -p '123456' ssh root@159.223.62.28

reboot

sudo apt upgrade

configuring openssh-server -> keep the local version currently installed

apt install docker-compose

create `docker-compose.prod.yml`

edit `djangobnb_backend/settings.py`

create `backend/nginx/Dockerfile`

create `backend/nginx/nginx.conf`

mkdir webapps

cd webapps

git clone https://github.com/lowjungxuan98/Djangobnb.git

cd Djangobnb/backend

touch .env

vi .env

paste in `.env`
```env
DEBUG=0
SECRET_KEY=codewithstein
DJANGO_ALLOWED_HOSTS=159.223.62.28 localhost 127.0.0.1 0.0.0.0 [::1]
SQL_ENGINE=django.db.backends.postgresql
SQL_DATABASE=djangobnb
SQL_USER=postgresuser
SQL_PASSWORD=postgrespassword
SQL_HOST=db
SQL_PORT=5432
DATABASE=postgres
```
cp .env djangobnb_backend/

docker-compose -f docker-compose.prod.yml up --build

apt install nginx

cd webapps/

service nginx start

cd /etc/nginx/sites-enabled/

rm default

touch frontend.conf; vi frontend.conf

paste
```nginx configuration
server {
    listen 80;
    server_name 159.223.62.28;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

service nginx restart

mv .env.prod .env

cd /webapps/Djangobnb/djangobnb

npm i -g pm2

pm2 start npm --name "djangobnb" -- start