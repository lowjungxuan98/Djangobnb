Error Log
```shell
(env) ~/Desktop/Djangobnb/backend/djangobnb_backend git:[main]
docker-compose exec web python manage.py migrate admin 0001 --fake

WARN[0000] /Users/lowjungxuan/Desktop/Djangobnb/backend/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion
Traceback (most recent call last):
File "/usr/src/djangobnb_backend/manage.py", line 22, in <module>
main()
~~~~^^
File "/usr/src/djangobnb_backend/manage.py", line 18, in main
execute_from_command_line(sys.argv)
~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^
File "/usr/local/lib/python3.13/site-packages/django/core/management/__init__.py", line 442, in execute_from_command_line
utility.execute()
~~~~~~~~~~~~~~~^^
File "/usr/local/lib/python3.13/site-packages/django/core/management/__init__.py", line 436, in execute
self.fetch_command(subcommand).run_from_argv(self.argv)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
File "/usr/local/lib/python3.13/site-packages/django/core/management/base.py", line 413, in run_from_argv
self.execute(*args, **cmd_options)
~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^
File "/usr/local/lib/python3.13/site-packages/django/core/management/base.py", line 459, in execute
output = self.handle(*args, **options)
File "/usr/local/lib/python3.13/site-packages/django/core/management/base.py", line 107, in wrapper
res = handle_func(*args, **kwargs)
File "/usr/local/lib/python3.13/site-packages/django/core/management/commands/migrate.py", line 121, in handle
executor.loader.check_consistent_history(connection)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^
File "/usr/local/lib/python3.13/site-packages/django/db/migrations/loader.py", line 327, in check_consistent_history
raise InconsistentMigrationHistory(
...<8 lines>...
)
django.db.migrations.exceptions.InconsistentMigrationHistory: Migration admin.0002_logentry_remove_auto_add is applied before its dependency admin.0001_initial on database 'default'.
```

```shell
docker-compose exec db psql -U postgresuser -d djangobnb
```
```shell
docker-compose exec web python manage.py migrate admin --fake
docker-compose exec web python manage.py makemigrations
docker-compose exec web python manage.py migrate
```

