#!/bin/bash
set -e

SERVICE_TYPE=${SERVICE_TYPE:-web}

if [ "$SERVICE_TYPE" = "worker" ]; then
  echo "Starting Celery worker..."
  exec celery -A core worker -l info --concurrency 2

elif [ "$SERVICE_TYPE" = "beat" ]; then
  echo "Starting Celery beat..."
  exec celery -A core beat -l info \
    --scheduler django_celery_beat.schedulers:DatabaseScheduler

else
  echo "Running migrations..."
  python manage.py migrate --noinput

  echo "Collecting static files..."
  python manage.py collectstatic --noinput

  echo "Starting Gunicorn on port ${PORT:-8000}..."
  exec gunicorn core.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers "${WEB_CONCURRENCY:-2}" \
    --worker-class sync \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
fi
