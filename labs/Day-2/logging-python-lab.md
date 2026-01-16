# Logging in Python Workshop

## Workshop Overview

In this practical workshop, you will learn essential Python logging techniques using the Django REST API application (PolarH10 Heart Rate Backend). You'll implement comprehensive logging from basic concepts to advanced patterns including structured logging, custom handlers, filters, and performance optimization.

### Learning Objectives

By the end of this workshop, you will be able to:
- Understand and use Python log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Configure the Python logging module with formatters and handlers
- Implement structured logging with JSON output for log aggregation systems
- Create custom handlers for different output destinations
- Build log filters for conditional logging and data sanitization
- Set up log rotation to manage log file sizes
- Implement context propagation for request tracing
- Understand logging performance implications and optimization techniques

---

## Task 1: Understanding Log Levels and Basic Configuration

### Overview
Learn the five standard Python log levels and how to configure basic logging in a Django application. You'll modify the application to emit logs at different severity levels.

### Step-by-Step Instructions

1. **Navigate to the backend directory and activate the virtual environment:**
   ```bash
   cd polarh10-backend
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Create a logging configuration file:**
   
   Create a new file `polarh10-backend/config/logging_config.py`:
   
   ```python
   """
   Logging configuration for polarh10-backend.
   """
   
   import logging
   import sys
   
   # Define log format
   LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
   
   def setup_basic_logging(level=logging.DEBUG):
       """
       Configure basic logging for the application.
       
       Log Levels (from lowest to highest severity):
           DEBUG (10)    - Detailed diagnostic information
           INFO (20)     - General operational information  
           WARNING (30)  - Something unexpected happened
           ERROR (40)    - A serious problem occurred
           CRITICAL (50) - A very serious error, program may crash
       """
       logging.basicConfig(
           level=level,
           format=LOG_FORMAT,
           datefmt=DATE_FORMAT,
           handlers=[
               logging.StreamHandler(sys.stdout)
           ]
       )
       
       # Get the root logger
       logger = logging.getLogger()
       logger.info("Logging configured successfully")
       
       return logger
   ```

3. **Add logging to the HeartRate views:**
   
   Open `polarh10-backend/heartrate/views.py` and add logging:
   
   ```python
   """
   API views for HeartRate app.
   """
   
   import logging
   from datetime import timedelta
   from django.utils import timezone
   from django.db.models import Avg, Min, Max, Count
   from rest_framework import viewsets, status
   from rest_framework.decorators import action
   from rest_framework.response import Response
   
   from .models import HeartRateReading
   from .serializers import HeartRateReadingSerializer, HeartRateStatsSerializer
   
   # Create a logger for this module
   logger = logging.getLogger(__name__)
   
   
   class HeartRateViewSet(viewsets.ReadOnlyModelViewSet):
       """
       API endpoint for heart rate readings.
       """
       
       queryset = HeartRateReading.objects.all()
       serializer_class = HeartRateReadingSerializer
   
       def get_queryset(self):
           """
           Optionally filter readings by time range.
           """
           logger.debug("get_queryset() called")
           
           queryset = HeartRateReading.objects.all()
           
           # Filter by last N minutes
           minutes = self.request.query_params.get('minutes')
           if minutes:
               try:
                   minutes = int(minutes)
                   cutoff_time = timezone.now() - timedelta(minutes=minutes)
                   queryset = queryset.filter(created_at__gte=cutoff_time)
                   logger.info(f"Filtering readings from last {minutes} minutes")
               except ValueError:
                   logger.warning(f"Invalid minutes parameter: {minutes}")
           
           count = queryset.count()
           logger.debug(f"Returning {count} readings")
           
           return queryset.order_by('-created_at')
   
       @action(detail=False, methods=['get'])
       def latest(self, request):
           """
           Get the most recent heart rate reading.
           """
           logger.info("Fetching latest heart rate reading")
           
           reading = HeartRateReading.objects.order_by('-created_at').first()
           if reading:
               logger.debug(f"Latest reading: {reading.bpm} BPM")
               serializer = self.get_serializer(reading)
               return Response(serializer.data)
           
           logger.warning("No heart rate readings available")
           return Response(
               {'detail': 'No readings available'},
               status=status.HTTP_404_NOT_FOUND
           )
   
       @action(detail=False, methods=['get'])
       def stats(self, request):
           """
           Get aggregated statistics for heart rate readings.
           """
           logger.info("Calculating heart rate statistics")
           
           try:
               queryset = self.get_queryset()
               
               stats = queryset.aggregate(
                   count=Count('id'),
                   avg_bpm=Avg('bpm'),
                   min_bpm=Min('bpm'),
                   max_bpm=Max('bpm'),
                   avg_rr_interval=Avg('rr_interval'),
                   time_range_start=Min('created_at'),
                   time_range_end=Max('created_at'),
               )
               
               # Round floating point values
               if stats['avg_bpm']:
                   stats['avg_bpm'] = round(stats['avg_bpm'], 1)
               if stats['avg_rr_interval']:
                   stats['avg_rr_interval'] = round(stats['avg_rr_interval'], 1)
               
               logger.info(f"Stats calculated: {stats['count']} readings, avg BPM: {stats['avg_bpm']}")
               
               serializer = HeartRateStatsSerializer(stats)
               return Response(serializer.data)
               
           except Exception as e:
               logger.error(f"Error calculating statistics: {e}", exc_info=True)
               return Response(
                   {'detail': 'Error calculating statistics'},
                   status=status.HTTP_500_INTERNAL_SERVER_ERROR
               )
   ```

4. **Configure Django's LOGGING setting:**
   
   Open `polarh10-backend/config/settings.py` and add the following at the end:
   
   ```python
   # Logging configuration
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{asctime} - {name} - {levelname} - {message}',
               'style': '{',
               'datefmt': '%Y-%m-%d %H:%M:%S',
           },
           'simple': {
               'format': '{levelname} - {message}',
               'style': '{',
           },
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'verbose',
           },
       },
       'root': {
           'handlers': ['console'],
           'level': 'DEBUG',
       },
       'loggers': {
           'heartrate': {
               'handlers': ['console'],
               'level': 'DEBUG',
               'propagate': False,
           },
           'django': {
               'handlers': ['console'],
               'level': 'INFO',
               'propagate': False,
           },
       },
   }
   ```

5. **Test the logging configuration:**
   
   Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   
   In another terminal, make API requests:
   ```bash
   # Get all readings - observe DEBUG and INFO logs
   curl http://localhost:8000/api/heartrate/
   
   # Get filtered readings - observe INFO log about filtering
   curl "http://localhost:8000/api/heartrate/?minutes=5"
   
   # Get stats - observe statistics calculation logs
   curl http://localhost:8000/api/heartrate/stats/
   
   # Test with invalid parameter - observe WARNING log
   curl "http://localhost:8000/api/heartrate/?minutes=invalid"
   ```

6. **Experiment with log levels:**
   
   Modify the `'level'` in `settings.py` from `'DEBUG'` to `'INFO'` and restart the server. Notice that DEBUG messages no longer appear.

7. **Configure different log levels for different modules:**
   
   Add a module-specific logger for `heartrate.views` with a different level than the parent `heartrate` package:
   
   ```python
   'loggers': {
       'heartrate': {
           'handlers': ['console'],
           'level': 'WARNING',  # Package: only WARNING and above
           'propagate': False,
       },
       'heartrate.views': {
           'handlers': ['console'],
           'level': 'DEBUG',  # Views only: verbose DEBUG logging
           'propagate': False,
       },
       'django': {
           'handlers': ['console'],
           'level': 'INFO',
           'propagate': False,
       },
   },
   ```
   
   Test it - only `heartrate.views` will show DEBUG logs, other `heartrate.*` modules will only show WARNING+.

8. **Observe logger propagation:**
   
   Change `heartrate.views` to `propagate: True`:
   
   ```python
   'heartrate.views': {
       'handlers': ['console'],
       'level': 'DEBUG',
       'propagate': True,  # Also sends to parent 'heartrate' logger
   },
   ```
   
   Restart and make a request:
   ```bash
   curl http://localhost:8000/api/heartrate/stats/
   ```
   
   You'll see **duplicate logs** (one from `heartrate.views`, one from parent `heartrate`).
   
   Set `'propagate': False` to fix duplicates when using dedicated handlers.

### Key Concepts

- **Log Level Hierarchy:** DEBUG < INFO < WARNING < ERROR < CRITICAL. Setting a level filters out lower-severity messages.
- **Logger Naming:** Use `__name__` to create module-specific loggers (e.g., `heartrate.views` for `views.py`).
- **Per-Module Configuration:** Set different log levels for different modules - verbose for code you're debugging, quieter for stable code.
- **Logger Propagation:** When `propagate=True`, messages bubble up to parent loggers. Set to `False` to prevent duplicate logs.

---

## Task 2: Structured Logging with JSON Format

### Overview
Implement structured logging that outputs JSON-formatted logs. This format is essential for log aggregation systems like ELK Stack, Cloud Logging, or Splunk where logs need to be parsed and queried.

### Step-by-Step Instructions

1. **Install the python-json-logger package:**
   ```bash
   pip install python-json-logger
   ```
   
   Add it to `requirements.txt`:
   ```
   python-json-logger==2.0.7
   ```

2. **Create a custom JSON formatter:**
   
   Create/update `polarh10-backend/config/logging_config.py`:
   
   ```python
   """
   Logging configuration for polarh10-backend with structured logging support.
   """
   
   import logging
   import json
   from datetime import datetime
   from pythonjsonlogger import jsonlogger
   
   
   class CustomJsonFormatter(jsonlogger.JsonFormatter):
       """
       Custom JSON formatter that adds standard fields to all log entries.
       """
       
       def add_fields(self, log_record, record, message_dict):
           super().add_fields(log_record, record, message_dict)
           
           # Add timestamp in ISO format
           log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
           
           # Add standard fields
           log_record['level'] = record.levelname
           log_record['logger'] = record.name
           log_record['module'] = record.module
           log_record['function'] = record.funcName
           log_record['line'] = record.lineno
           
           # Add application identifier
           log_record['service'] = 'polarh10-backend'
           
           # Remove redundant fields
           if 'levelname' in log_record:
               del log_record['levelname']
           if 'name' in log_record:
               del log_record['name']
   
   
   def get_json_handler():
       """
       Create a console handler with JSON formatting.
       """
       handler = logging.StreamHandler()
       formatter = CustomJsonFormatter(
           '%(timestamp)s %(level)s %(name)s %(message)s'
       )
       handler.setFormatter(formatter)
       return handler
   ```

3. **Update Django's LOGGING configuration:**
   
   Modify the LOGGING configuration in `polarh10-backend/config/settings.py`:
   
   ```python
   # Logging configuration with JSON support
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{asctime} - {name} - {levelname} - {message}',
               'style': '{',
               'datefmt': '%Y-%m-%d %H:%M:%S',
           },
           'json': {
               '()': 'config.logging_config.CustomJsonFormatter',
               'format': '%(timestamp)s %(level)s %(name)s %(message)s',
           },
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'verbose',
           },
           'console_json': {
               'class': 'logging.StreamHandler',
               'formatter': 'json',
           },
       },
       'root': {
           'handlers': ['console'],
           'level': 'DEBUG',
       },
       'loggers': {
           'heartrate': {
               'handlers': ['console_json'],  # Use JSON formatter
               'level': 'DEBUG',
               'propagate': False,
           },
           'django': {
               'handlers': ['console'],
               'level': 'INFO',
               'propagate': False,
           },
       },
   }
   ```

4. **Add structured context to log messages:**
   
   Update `polarh10-backend/heartrate/views.py` to use structured logging with extra fields:
   
   ```python
   @action(detail=False, methods=['get'])
   def stats(self, request):
       """
       Get aggregated statistics for heart rate readings.
       """
       # Log with extra structured fields
       logger.info(
           "Calculating heart rate statistics",
           extra={
               'action': 'calculate_stats',
               'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown'),
               'remote_ip': request.META.get('REMOTE_ADDR', 'unknown'),
           }
       )
       
       try:
           queryset = self.get_queryset()
           
           stats = queryset.aggregate(
               count=Count('id'),
               avg_bpm=Avg('bpm'),
               min_bpm=Min('bpm'),
               max_bpm=Max('bpm'),
               avg_rr_interval=Avg('rr_interval'),
               time_range_start=Min('created_at'),
               time_range_end=Max('created_at'),
           )
           
           # Round floating point values
           if stats['avg_bpm']:
               stats['avg_bpm'] = round(stats['avg_bpm'], 1)
           if stats['avg_rr_interval']:
               stats['avg_rr_interval'] = round(stats['avg_rr_interval'], 1)
           
           # Log with structured data
           logger.info(
               "Stats calculation completed",
               extra={
                   'action': 'calculate_stats',
                   'status': 'success',
                   'reading_count': stats['count'],
                   'avg_bpm': stats['avg_bpm'],
                   'min_bpm': stats['min_bpm'],
                   'max_bpm': stats['max_bpm'],
               }
           )
           
           serializer = HeartRateStatsSerializer(stats)
           return Response(serializer.data)
           
       except Exception as e:
           logger.error(
               f"Error calculating statistics: {e}",
               extra={
                   'action': 'calculate_stats',
                   'status': 'error',
                   'error_type': type(e).__name__,
               },
               exc_info=True
           )
           return Response(
               {'detail': 'Error calculating statistics'},
               status=status.HTTP_500_INTERNAL_SERVER_ERROR
           )
   ```

5. **Test structured logging output:**
   
   Restart the server and make requests:
   ```bash
   python manage.py runserver
   ```
   
   ```bash
   curl http://localhost:8000/api/heartrate/stats/
   ```
   
   Observe the JSON output in the console:
   ```json
   {"timestamp": "2025-01-10T10:30:45.123456Z", "level": "INFO", "logger": "heartrate.views", "message": "Calculating heart rate statistics", "service": "polarh10-backend", "action": "calculate_stats", "user_agent": "curl/8.0.1", "remote_ip": "127.0.0.1", "module": "views", "function": "stats", "line": 75}
   ```


### Key Concepts

- **Structured Logging:** Log entries as key-value pairs (JSON) instead of plain text for easier parsing and querying.
- **Extra Fields:** Use the `extra` parameter to add context without modifying the message string.
- **Log Aggregation:** JSON logs integrate seamlessly with ELK Stack, Cloud Logging, Datadog, etc.
- **Consistent Fields:** Include standard fields (timestamp, service, level) in every log entry.
- **Request Context:** Include request metadata (IP, user agent, path) for debugging and security analysis.

---

## Task 3: Custom Handlers, Filters, and Log Rotation

### Overview
Learn to create custom log handlers for different destinations, implement filters for conditional logging and data sanitization, and set up log rotation to manage file sizes.

### Step-by-Step Instructions

1. **Create a custom file handler with rotation:**
   
   Update `polarh10-backend/config/logging_config.py`:
   
   ```python
   """
   Logging configuration for polarh10-backend with handlers, filters, and rotation.
   """
   
   import logging
   import os
   from datetime import datetime
   from logging.handlers import RotatingFileHandler
   from pythonjsonlogger import jsonlogger
   
   
   class CustomJsonFormatter(jsonlogger.JsonFormatter):
       """Custom JSON formatter with standard fields."""
       
       def add_fields(self, log_record, record, message_dict):
           super().add_fields(log_record, record, message_dict)
           log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
           log_record['level'] = record.levelname
           log_record['logger'] = record.name
           log_record['service'] = 'polarh10-backend'
           
           if 'levelname' in log_record:
               del log_record['levelname']
   
   
   class SensitiveDataFilter(logging.Filter):
       """
       Filter that redacts sensitive information from log messages.
       """
       
       SENSITIVE_PATTERNS = [
           'password',
           'secret',
           'token',
           'api_key',
           'authorization',
           'credit_card',
       ]
       
       def filter(self, record):
           # Check and sanitize the message
           message = record.getMessage()
           
           for pattern in self.SENSITIVE_PATTERNS:
               if pattern.lower() in message.lower():
                   # Redact the sensitive value
                   record.msg = self._redact_sensitive_data(record.msg)
                   break
           
           return True  # Always allow the log through (just sanitized)
       
       def _redact_sensitive_data(self, message):
           """Replace sensitive data with [REDACTED]."""
           import re
           
           for pattern in self.SENSITIVE_PATTERNS:
               # Match patterns like: password=value, "password": "value"
               regex = rf'({pattern}["\']?\s*[:=]\s*["\']?)([^"\'\s,}}]+)'
               message = re.sub(regex, r'\1[REDACTED]', message, flags=re.IGNORECASE)
           
           return message
   
   
   class HighBPMFilter(logging.Filter):
       """
       Filter that only allows logs related to high BPM readings.
       Useful for monitoring unusual heart rate patterns.
       """
       
       def __init__(self, threshold=150):
           super().__init__()
           self.threshold = threshold
       
       def filter(self, record):
           # Check if the record has BPM information in extra fields
           if hasattr(record, 'bpm'):
               return record.bpm >= self.threshold
           
           # Check if BPM is mentioned in the message
           message = record.getMessage()
           if 'bpm' in message.lower():
               import re
               bpm_match = re.search(r'(\d+)\s*bpm', message, re.IGNORECASE)
               if bpm_match:
                   bpm = int(bpm_match.group(1))
                   return bpm >= self.threshold
           
           # Allow all other logs
           return True
   
   
   class ErrorOnlyFilter(logging.Filter):
       """Filter that only allows ERROR and CRITICAL level logs."""
       
       def filter(self, record):
           return record.levelno >= logging.ERROR
   
   
   def get_rotating_file_handler(filename, max_bytes=5*1024*1024, backup_count=5):
       """
       Create a rotating file handler.
       
       Args:
           filename: Path to the log file
           max_bytes: Maximum file size before rotation (default: 5MB)
           backup_count: Number of backup files to keep
       """
       # Ensure logs directory exists
       log_dir = os.path.dirname(filename)
       if log_dir and not os.path.exists(log_dir):
           os.makedirs(log_dir)
       
       handler = RotatingFileHandler(
           filename=filename,
           maxBytes=max_bytes,
           backupCount=backup_count,
           encoding='utf-8',
           delay=True,
       )
       
       formatter = CustomJsonFormatter(
           '%(timestamp)s %(level)s %(name)s %(message)s'
       )
       handler.setFormatter(formatter)
       
       return handler
   ```
   
   > **💡 Note:** The `delay=True` parameter is important for cross-platform compatibility.
   > It delays opening the file until the first log is written, which helps avoid
   > file locking issues on Windows during log rotation.

2. **Update Django settings to use handlers and filters:**
   
   Update `polarh10-backend/config/settings.py`:
   
   ```python
   # Logging configuration with handlers, filters, and rotation
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'verbose': {
               'format': '{asctime} - {name} - {levelname} - {message}',
               'style': '{',
               'datefmt': '%Y-%m-%d %H:%M:%S',
           },
           'json': {
               '()': 'config.logging_config.CustomJsonFormatter',
               'format': '%(timestamp)s %(level)s %(name)s %(message)s',
           },
       },
       'filters': {
           'sensitive_data': {
               '()': 'config.logging_config.SensitiveDataFilter',
           },
           'error_only': {
               '()': 'config.logging_config.ErrorOnlyFilter',
           },
           'high_bpm': {
               '()': 'config.logging_config.HighBPMFilter',
               'threshold': 150,
           },
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'verbose',
               'filters': ['sensitive_data'],
           },
           'console_json': {
               'class': 'logging.StreamHandler',
               'formatter': 'json',
               'filters': ['sensitive_data'],
           },
           'file_rotating': {
               'class': 'logging.handlers.RotatingFileHandler',
               'filename': BASE_DIR / 'logs' / 'app.log',
               'maxBytes': 5 * 1024 * 1024,  # 5 MB
               'backupCount': 5,
               'formatter': 'json',
               'filters': ['sensitive_data', 'high_bpm'],
               'delay': True,
           },
           'file_errors': {
               'class': 'logging.handlers.RotatingFileHandler',
               'filename': BASE_DIR / 'logs' / 'errors.log',
               'maxBytes': 5 * 1024 * 1024,  # 5 MB
               'backupCount': 10,
               'formatter': 'json',
               'filters': ['error_only', 'sensitive_data'],
               'delay': True,
           },
       },
       'root': {
           'handlers': ['console'],
           'level': 'DEBUG',
       },
       'loggers': {
           'heartrate': {
               'handlers': ['console_json', 'file_rotating', 'file_errors'],
               'level': 'DEBUG',
               'propagate': False,
           },
           'django': {
               'handlers': ['console'],
               'level': 'INFO',
               'propagate': False,
           },
           'django.request': {
               'handlers': ['console', 'file_errors'],
               'level': 'ERROR',
               'propagate': False,
           },
       },
   }
   ```

3. **Create the logs directory:**
   ```bash
   mkdir -p polarh10-backend/logs
   ```

4. **Test the sensitive data filter:**
   
   Add a test endpoint in `polarh10-backend/heartrate/views.py`:
   
   ```python
   @action(detail=False, methods=['get'])
   def test_logging(self, request):
       """
       Test endpoint for logging demonstrations.
       DELETE THIS IN PRODUCTION.
       """
       # Test sensitive data filtering
       logger.info("User login attempt with password=secret123")
       logger.info("API call with api_key=sk_live_abc123xyz")
       logger.debug("Processing token=eyJhbGciOiJIUzI1NiJ9...")
       
       # Test log levels
       logger.debug("This is a DEBUG message")
       logger.info("This is an INFO message")
       logger.warning("This is a WARNING message")
       logger.error("This is an ERROR message")
       logger.critical("This is a CRITICAL message")
       
       # Test structured logging with BPM
       logger.info(
           "Heart rate reading recorded",
           extra={'bpm': 180, 'user_id': 'test_user'}
       )
       logger.info(
            "Too low bpm to log",
            extra={'bpm': 90, 'user_id': 'test_user'}
        )
       
       return Response({'status': 'Logging test completed. Check your logs!'})
   ```


5. **Test the implementation:**
   
   ```bash
   python manage.py runserver
   ```
   
   ```bash
   curl http://localhost:8000/api/heartrate/test_logging/
   ```
   
   Check the output:
   - Console shows sanitized messages (passwords redacted)
   - `logs/app.log` contains all application logs in JSON format
   - `logs/errors.log` contains only ERROR and CRITICAL logs

6. **Verify log rotation:**
   
   To test rotation, temporarily set `maxBytes` to a small value (e.g., 1024) in `settings.py`:
   
   ```python
   'file_rotating': {
       'class': 'logging.handlers.RotatingFileHandler',
       'filename': BASE_DIR / 'logs' / 'app.log',
       'maxBytes': 1024,  # 1 KB for testing
       'backupCount': 5,
       'formatter': 'json',
       'filters': ['sensitive_data'],
       'delay': True,
   },
   ```
   
   Restart the server and generate many log entries.
   
   Check the `logs/` directory for rotated files (app.log, app.log.1, app.log.2, etc.).
   
   **Don't forget to change `maxBytes` back to 5MB after testing!**

### Key Concepts

- **Handlers:** Direct log output to different destinations (console, file, network, email).
- **RotatingFileHandler:** Rotates logs based on file size to prevent disk space issues.
- **Filters:** Conditionally process or reject log records based on custom logic.
- **Data Sanitization:** Use filters to redact sensitive information before logging.
- **Multiple Handlers:** Send the same log to multiple destinations (console + file + error file).

---

## Task 4: Request Tracing and Performance Impact

### Overview
Implement request tracing using context propagation to track requests across function calls. You'll also measure the performance impact of logging to understand optimization techniques.

### Step-by-Step Instructions

1. **Create the request tracking middleware:**
   
   Create `polarh10-backend/config/middleware.py`:
   
   ```python
   """
   Request tracking with context propagation.
   """
   import logging
   import uuid
   import time
   import threading
   
   logger = logging.getLogger(__name__)
   
   # Thread-local storage: each request thread gets its own copy
   _request_context = threading.local()
   
   
   def get_request_id():
       """Get the current request ID (call from anywhere in your code)."""
       return getattr(_request_context, 'request_id', '-')
   
   
   class ContextFilter(logging.Filter):
       """Automatically adds request_id to ALL log records."""
       
       def filter(self, record):
           record.request_id = get_request_id()
           return True
   
   
   class RequestTrackingMiddleware:
       """Adds a unique ID to every request and logs timing."""
       
       def __init__(self, get_response):
           self.get_response = get_response
       
       def __call__(self, request):
           # Generate and store request ID
           request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())[:8]
           _request_context.request_id = request_id
           
           start_time = time.time()
           logger.info(f"Started: {request.method} {request.path}")
           
           try:
               response = self.get_response(request)
               duration_ms = (time.time() - start_time) * 1000
               logger.info(f"Completed: {response.status_code} in {duration_ms:.1f}ms")
               response['X-Request-ID'] = request_id
               return response
           finally:
               # Always clean up (important for thread reuse!)
               _request_context.request_id = None
   ```

2. **Add the middleware to `settings.py`:**
   
   Find the `MIDDLEWARE` list and add your middleware at the top:
   ```python
   MIDDLEWARE = [
       'config.middleware.RequestTrackingMiddleware',  # Add this line
       'django.middleware.security.SecurityMiddleware',
       # ... rest of middleware
   ]
   ```

3. **Update the LOGGING config in `settings.py`:**
   
   Add the context filter and update the formatter to include request IDs:
   ```python
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'formatters': {
           'with_request_id': {
               'format': '{asctime} [{request_id}] {name} - {levelname} - {message}',
               'style': '{',
           },
           'json': {
               '()': 'config.logging_config.CustomJsonFormatter',
               'format': '%(timestamp)s %(level)s %(name)s %(message)s',
           },
       },
       'filters': {
           'context': {
               '()': 'config.middleware.ContextFilter',
           },
           'sensitive_data': {
               '()': 'config.logging_config.SensitiveDataFilter',
           },
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'with_request_id',
               'filters': ['context', 'sensitive_data'],
           },
           'console_json': {
               'class': 'logging.StreamHandler',
               'formatter': 'json',
               'filters': ['context', 'sensitive_data'],
           },
       },
       'root': {
           'handlers': ['console'],
           'level': 'DEBUG',
       },
       'loggers': {
           'heartrate': {
               'handlers': ['console_json'],
               'level': 'DEBUG',
               'propagate': False,
           },
           'config': {
               'handlers': ['console_json'],
               'level': 'DEBUG',
               'propagate': False,
           },
           'django': {
               'handlers': ['console'],
               'level': 'INFO',
               'propagate': False,
           },
       },
   }
   ```

4. **Test request tracing:**
   
   Restart the server and send multiple requests:
   ```bash
   python manage.py runserver
   ```
   
   Run multiple times:
   ```bash
   curl http://localhost:8000/api/heartrate/stats/
   ```
   
   Observe that all logs now include the request ID:
   ```
   2025-01-10 10:30:45 [a1b2c3d4] config.middleware - INFO - Started: GET /api/heartrate/stats/
   2025-01-10 10:30:45 [a1b2c3d4] heartrate.views - INFO - Calculating heart rate statistics
   2025-01-10 10:30:45 [a1b2c3d4] config.middleware - INFO - Completed: 200 in 45.2ms
   ```


5. **Measure logging performance impact in the real API:**
   
   Add a test endpoint to `polarh10-backend/heartrate/views.py` that simulates intensive logging:
   
   ```python
   @action(detail=False, methods=['get'])
   def performance_test(self, request):
       """
       Test endpoint to measure logging performance impact.
       Compare: /api/heartrate/performance_test/?logs=0
               /api/heartrate/performance_test/?logs=1000
       """
       import time
       
       log_count = int(request.query_params.get('logs', 0))
       
       start_time = time.perf_counter()
       
       # Simulate processing with optional intensive logging
       readings = list(HeartRateReading.objects.all()[:100])
       
       for i in range(log_count):
           logger.debug(
               "Processing reading %d: bpm=%s, timestamp=%s",
               i,
               readings[i % len(readings)].bpm if readings else 'N/A',
               readings[i % len(readings)].created_at if readings else 'N/A'
           )
       
       duration_ms = (time.perf_counter() - start_time) * 1000
       
       return Response({
           'log_count': log_count,
           'duration_ms': round(duration_ms, 2),
           'readings_processed': len(readings),
       })
   ```

6. **Test the performance impact:**
   
   Restart the server and compare response times:
   ```bash
   python manage.py runserver
   ```
   
   ```bash
   # Baseline - no extra logging
   curl "http://localhost:8000/api/heartrate/performance_test/?logs=0"
   
   # With 100 log statements
   curl "http://localhost:8000/api/heartrate/performance_test/?logs=100"
   
   # With 1000 log statements
   curl "http://localhost:8000/api/heartrate/performance_test/?logs=1000"
   ```
   


7. **Reduce impact by changing log level:**
   
   In `settings.py`, change the heartrate logger level from `DEBUG` to `INFO`:
   ```python
   'heartrate': {
       'handlers': ['console_json'],
       'level': 'INFO',  # Changed from DEBUG
       'propagate': False,
   },
   ```
   
   Restart and test again:
   ```bash
   curl "http://localhost:8000/api/heartrate/performance_test/?logs=1000"
   ```
   
   The response time should now be close to the baseline because DEBUG logs are filtered out before formatting or I/O happens.

8. **Apply best practices to your code:**
   
   Use lazy formatting to minimize overhead when logs are filtered:
   ```python
   # BAD - f-string always formatted, even if DEBUG is disabled:
   logger.debug(f"Processing {len(readings)} readings")
   
   # GOOD - string only formatted if DEBUG level is enabled:
   logger.debug("Processing %d readings", len(readings))
   ```
   
   Remove the `performance_test` endpoint after testing.

### Key Concepts

- **Request ID:** A unique identifier that follows a request through your entire system
- **Context Filter:** Automatically injects context into every log record without changing logging calls
- **X-Request-ID Header:** Industry standard for passing request IDs between services
- **Lazy Formatting:** Use `%s` placeholders instead of f-strings to avoid string construction when log level is disabled
- **Level Checking:** Use `logger.isEnabledFor()` before expensive operations to avoid unnecessary computation

---

## Best Practices

1. **Use appropriate log levels** — DEBUG for development details, INFO for operations, WARNING for unexpected situations, ERROR for failures
2. **Include context in messages** — Add relevant IDs, counts, and values to make logs actionable
3. **Use structured logging** — JSON format enables easier searching and analysis
4. **Use external log rotation** — In production, use `logrotate` or cloud logging services
5. **Sanitize sensitive data** — Filter passwords, tokens, and PII before logging
6. **Optimize for performance** — Use lazy formatting and level checking for high-volume logs
7. **Separate error logs** — Write errors to a dedicated file for easier monitoring
8. **Use meaningful logger names** — Use `__name__` for module-specific loggers

---

END LAB
