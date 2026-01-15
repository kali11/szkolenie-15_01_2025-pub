# Django Debug Toolbar Workshop

## Workshop Overview

In this practical workshop, you will learn to use the Django Debug Toolbar to analyze and optimize your Django REST API. You'll work with the PolarH10 application (Django backend + Next.js frontend) to explore SQL query analysis, HTTP headers inspection, cache analysis, signal tracking, and performance optimization.

### Learning Objectives

By the end of this workshop, you will be able to:
- Install and configure Django Debug Toolbar for REST API development
- Analyze SQL queries and identify N+1 problems and optimization opportunities
- Inspect HTTP request/response headers and understand the request lifecycle
- Monitor Django signals and understand their impact on performance
- Analyze cache usage and implement caching strategies
- Use profiling data to optimize API performance
- Correlate frontend behavior with backend performance metrics

---

## Task 1: Install and Configure Django Debug Toolbar

### Overview
Set up the Django Debug Toolbar in the PolarH10 backend application and learn how to use it alongside the frontend application.

### Step-by-Step Instructions

1. **Navigate to the backend directory and activate the virtual environment:**
   ```bash
   cd polarh10-backend
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install Django Debug Toolbar:**
   ```bash
   pip install django-debug-toolbar
   ```
   
   Add it to `requirements.txt`:
   ```
   django-debug-toolbar==4.4.6
   ```

3. **Update Django settings:**
   
   Open `polarh10-backend/config/settings.py` and make the following changes:

   a) Add `debug_toolbar` to `INSTALLED_APPS`:
   ```python
   INSTALLED_APPS = [
       'django.contrib.admin',
       'django.contrib.auth',
       'django.contrib.contenttypes',
       'django.contrib.sessions',
       'django.contrib.messages',
       'django.contrib.staticfiles',
       # Third-party apps
       'rest_framework',
       'corsheaders',
       'debug_toolbar',  # Add this line
       # Local apps
       'heartrate',
   ]
   ```

   b) Add the Debug Toolbar middleware (place it early in the list):
   ```python
   MIDDLEWARE = [
       'debug_toolbar.middleware.DebugToolbarMiddleware',  # Add this line first
       'django.middleware.security.SecurityMiddleware',
       'django.contrib.sessions.middleware.SessionMiddleware',
       'corsheaders.middleware.CorsMiddleware',
       'django.middleware.common.CommonMiddleware',
       'django.middleware.csrf.CsrfViewMiddleware',
       'django.contrib.auth.middleware.AuthenticationMiddleware',
       'django.contrib.messages.middleware.MessageMiddleware',
       'django.middleware.clickjacking.XFrameOptionsMiddleware',
   ]
   ```

   c) Add the Debug Toolbar configuration at the end of the file:
   ```python
   # Django Debug Toolbar settings
   INTERNAL_IPS = [
       '127.0.0.1',
       'localhost',
   ]
   
   DEBUG_TOOLBAR_CONFIG = {
       'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
       # Increase history size (default is 10) - useful when frontend polls frequently
       'RESULTS_CACHE_SIZE': 200,
   }
   ```

4. **Configure URLs for the Debug Toolbar:**
   
   Open `polarh10-backend/config/urls.py` and update it:
   ```python
   """
   URL configuration for polarh10-backend project.
   """
   
   from django.contrib import admin
   from django.urls import path, include
   from django.conf import settings
   
   urlpatterns = [
       path('admin/', admin.site.urls),
       path('api/', include('heartrate.urls')),
   ]
   
   # Add Debug Toolbar URLs in development
   if settings.DEBUG:
       import debug_toolbar
       urlpatterns = [
           path('__debug__/', include(debug_toolbar.urls)),
       ] + urlpatterns
   ```

5. **Start both the backend and frontend:**
   
   Terminal 1 - Backend:
   ```bash
   cd polarh10-backend
   .\venv\Scripts\activate  # Windows
   python manage.py runserver
   ```
   
   Terminal 2 - Frontend:
   ```bash
   cd polarh10-frontend
   npm install # if you are running the application for the first time
   npm run dev
   ```

6. **Open the frontend and backend side by side:**
   
   - **Frontend:** http://localhost:3000 - The Heart Rate Dashboard
   - **Backend API:** http://localhost:8000/api/heartrate/ - Open in a separate browser tab
   
   When you open the API endpoint directly in your browser, you'll see the DRF Browsable API with the Debug Toolbar appearing as a sidebar on the right side of the page.

7. **Explore the Debug Toolbar panels:**
   
   Click on the Debug Toolbar sidebar (labeled "DjDT"). You'll see these panels:
   
   | Panel | Description |
   |-------|-------------|
   | **History** | Previous requests - useful for comparing different API calls |
   | **Time** | Request timing |
   | **Headers** | HTTP request/response headers |
   | **Request** | Request data (GET, POST, cookies) |
   | **SQL** | Database queries with timing and EXPLAIN |
   | **Cache** | Cache operations |
   | **Signals** | Django signals fired |
   | **Profiling** | Python profiling data |

8. **Correlate frontend activity with backend metrics:**
   
   - Watch the frontend dashboard update (it polls the API every second)
   - Open http://localhost:8000/api/heartrate/stats/ in your browser
   - Click on the **History** panel to see all recent API requests
   - Notice the requests from the frontend appearing in the history
   - You can swith to specific incident (History > Action > Switch) and investigate it's Header, Request details or SQL 
   
   This is how you investigate: use the frontend normally, then check the Debug Toolbar to see what's happening on the backend.
   
   > **Tip:** We configured `RESULTS_CACHE_SIZE: 200` to keep more requests in history. The default is only 10, which gets filled quickly when the frontend polls every second. You can also temporarily close frontend while investigating a specific request.

### Key Concepts

- **Debug Toolbar Middleware:** Captures request data for analysis
- **INTERNAL_IPS:** Restricts toolbar visibility to specified IP addresses
- **History Panel:** Shows all recent requests - essential for investigating frontend-triggered API calls
- **DRF Browsable API:** When you open API endpoints in a browser, you get an interactive interface with the Debug Toolbar

---

## Task 2: SQL Query Analysis and HTTP Headers

### Overview
Learn to analyze SQL queries and HTTP headers using the Debug Toolbar. You'll create endpoints to demonstrate efficient vs inefficient query patterns, and compare requests made directly from the browser vs those made by the frontend.

### Step-by-Step Instructions

1. **Create API endpoints for SQL analysis:**
   
   Open `polarh10-backend/heartrate/views.py` and add new endpoints:
   
   ```python
   """
   API views for HeartRate app.
   """
   
   from datetime import timedelta
   from django.utils import timezone
   from django.db.models import Avg, Min, Max, Count
   from rest_framework import viewsets, status
   from rest_framework.decorators import action, api_view
   from rest_framework.response import Response
   
   from .models import HeartRateReading
   from .serializers import HeartRateReadingSerializer, HeartRateStatsSerializer
   
   
   @api_view(['GET'])
   def sql_inefficient(request):
       """
       API endpoint demonstrating inefficient SQL patterns.
       """
       # INEFFICIENT: Multiple separate queries for aggregates
       count = HeartRateReading.objects.count()
       avg_bpm = HeartRateReading.objects.aggregate(avg=Avg('bpm'))['avg']
       min_bpm = HeartRateReading.objects.aggregate(min=Min('bpm'))['min']
       max_bpm = HeartRateReading.objects.aggregate(max=Max('bpm'))['max']
       
       # INEFFICIENT: Fetching all fields when only some are needed
       readings = list(HeartRateReading.objects.all()[:50])
       readings_data = [
           {
               'id': r.id,
               'bpm': r.bpm,
               'timestamp': r.created_at.isoformat(),
           }
           for r in readings
       ]
       
       return Response({
           'stats': {
               'count': count,
               'avg_bpm': round(avg_bpm, 1) if avg_bpm else None,
               'min_bpm': min_bpm,
               'max_bpm': max_bpm,
           },
           'readings_count': len(readings_data),
           'optimization_note': 'This endpoint uses 5+ separate queries - check SQL panel!',
       })
   
   
   @api_view(['GET'])
   def sql_optimized(request):
       """
       API endpoint demonstrating optimized SQL patterns.
       """
       # OPTIMIZED: Single query for all aggregates
       stats = HeartRateReading.objects.aggregate(
           count=Count('id'),
           avg_bpm=Avg('bpm'),
           min_bpm=Min('bpm'),
           max_bpm=Max('bpm'),
       )
       
       # OPTIMIZED: Fetch only needed fields with .only()
       readings = list(
           HeartRateReading.objects
           .only('id', 'bpm', 'created_at')
           .order_by('-created_at')[:50]
       )
       readings_data = [
           {
               'id': r.id,
               'bpm': r.bpm,
               'timestamp': r.created_at.isoformat(),
           }
           for r in readings
       ]
       
       if stats['avg_bpm']:
           stats['avg_bpm'] = round(stats['avg_bpm'], 1)
       
       return Response({
           'stats': stats,
           'readings_count': len(readings_data),
           'optimization_note': 'This endpoint uses only 2 queries - compare with inefficient!',
       })
   
   
   # Keep the existing HeartRateViewSet class below...
   class HeartRateViewSet(viewsets.ReadOnlyModelViewSet):
       # ... existing code stays the same ...
   ```

2. **Add URLs for the new endpoints:**
   
   Update `polarh10-backend/heartrate/urls.py`:
   ```python
   """
   URL configuration for HeartRate API.
   """
   
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   
   from .views import (
       HeartRateViewSet,
       sql_inefficient,
       sql_optimized,
   )
   
   router = DefaultRouter()
   router.register(r'heartrate', HeartRateViewSet, basename='heartrate')
   
   urlpatterns = [
       # Debug/analysis endpoints
       path('debug/sql-inefficient/', sql_inefficient, name='sql_inefficient'),
       path('debug/sql-optimized/', sql_optimized, name='sql_optimized'),
       # Main API
       path('', include(router.urls)),
   ]
   ```

3. **Compare the SQL endpoints:**
   
   Open both URLs in your browser (in separate tabs):
   - http://localhost:8000/api/debug/sql-inefficient/
   - http://localhost:8000/api/debug/sql-optimized/
   
   Click on the **SQL** panel in each tab and compare:
   
   | Endpoint | Queries | Why |
   |----------|---------|-----|
   | sql-inefficient | 5+ | Each aggregate is a separate query |
   | sql-optimized | 2 | All aggregates combined, uses .only() |

4. **Use the SQL panel features:**
   
   In the SQL panel, click on any query to see:
   - **Sel:** The raw SQL SELECT statement
   - **Expl:** Database query execution plan (EXPLAIN)
   - **Stack:** Toggle to see where in your code the query originated
   
   Duplicate/similar queries are highlighted with matching colors.

5. **Analyze headers on the stats endpoint:**
   
   Open http://localhost:8000/api/heartrate/stats/ in your browser.
   
   Click on the **Headers** panel to see:
   - **Request headers:** What your browser sent (User-Agent, Accept, etc.)
   - **Response headers:** What Django returned (Content-Type, CORS headers, etc.)

6. **Compare browser vs frontend requests:**
   
   Now let's compare headers between a direct browser request and a frontend request.
   
   With the frontend running (http://localhost:3000), open the **History** panel in Debug Toolbar. Find a request to `/api/heartrate/stats/?minutes=5` made by the frontend and click on it.
   
   Compare the headers with your direct browser request to `/api/heartrate/stats/`:
   
   | Header | Browser Request | Frontend Request |
   |--------|-----------------|------------------|
   | Origin | (not set) | `http://localhost:3000` |
   | User-Agent | Your browser | Your browser (via fetch) |
   | Referer | (not set) | `http://localhost:3000/` |

7. **Observe CORS in action:**
   
   When the frontend makes requests, the backend adds CORS headers to the response:
   - `Access-Control-Allow-Origin: http://localhost:3000`
   - `Access-Control-Allow-Credentials`
   
   These are added by the `corsheaders` middleware. You can see them in the Headers panel for frontend requests. Direct browser requests don't need CORS headers since they're same-origin.

### Key Concepts

- **N+1 Problem:** Multiple queries where one would suffice
- **aggregate():** Combine multiple aggregations into a single query
- **only() / defer():** Limit which fields are fetched
- **Request Headers:** Metadata sent by the client
- **Response Headers:** Metadata sent by the server
- **CORS Headers:** Enable cross-origin requests from the frontend
- **History Panel:** Compare SQL queries and headers across different requests

---

## Task 3: Signals and Cache Analysis

### Overview
Learn to monitor Django signals and analyze cache usage. Understand how these affect API performance when the frontend is actively polling.

Django signals allow decoupled applications to get notified when certain actions occur elsewhere in the framework. For example, the `post_save` signal is sent after a model's `save()` method is called, allowing you to automatically perform actions (like invalidating cache or sending notifications) without modifying the original code.

### Step-by-Step Instructions

1. **Create custom signals:**
   
   Create a new file `polarh10-backend/heartrate/signals.py`:
   ```python
   """
   Custom Django signals for HeartRate app.
   """
   
   import logging
   from django.db.models.signals import post_save, pre_save, post_delete
   from django.dispatch import receiver, Signal
   from django.core.cache import cache
   
   from .models import HeartRateReading
   
   logger = logging.getLogger(__name__)
   
   # Custom signal for high BPM alerts
   high_bpm_detected = Signal()
   
   
   @receiver(pre_save, sender=HeartRateReading)
   def validate_reading(sender, instance, **kwargs):
       """Validate BPM before saving."""
       if instance.bpm < 30 or instance.bpm > 250:
           logger.warning(f"Unusual BPM value: {instance.bpm}")
   
   
   @receiver(post_save, sender=HeartRateReading)
   def on_reading_saved(sender, instance, created, **kwargs):
       """Invalidate cache when new reading is saved."""
       cache.delete('heartrate_stats')
       cache.delete('latest_reading')
       
       if instance.bpm > 150:
           high_bpm_detected.send(sender=sender, reading=instance)
   
   
   @receiver(post_delete, sender=HeartRateReading)
   def on_reading_deleted(sender, instance, **kwargs):
       """Invalidate cache when reading is deleted."""
       cache.delete('heartrate_stats')
   
   
   @receiver(high_bpm_detected)
   def handle_high_bpm(sender, reading, **kwargs):
       """Handle high BPM alert."""
       logger.warning(f"HIGH BPM ALERT: {reading.bpm} BPM!")
   ```

2. **Register signals in the app config:**
   
   Update `polarh10-backend/heartrate/apps.py`:
   ```python
   from django.apps import AppConfig
   
   
   class HeartrateConfig(AppConfig):
       default_auto_field = 'django.db.models.BigAutoField'
       name = 'heartrate'
       
       def ready(self):
           import heartrate.signals  # noqa
   ```

3. **Configure caching:**
   
   Add to `polarh10-backend/config/settings.py`:
   ```python
   # Cache configuration
   CACHES = {
       'default': {
           'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
           'LOCATION': 'unique-snowflake',
       }
   }
   ```

4. **Create cache demonstration endpoints:**
   
   Add to `polarh10-backend/heartrate/views.py`:
   ```python
   from django.core.cache import cache
   import time
   
   
   @api_view(['GET'])
   def cache_demo(request):
       """
       Demonstrates cache usage. Refresh to see cache hits!
       """
       cache_info = {'stats_hit': False, 'latest_hit': False}
       
       # Try cache first
       stats = cache.get('heartrate_stats')
       if stats is None:
           stats = HeartRateReading.objects.aggregate(
               count=Count('id'),
               avg_bpm=Avg('bpm'),
               min_bpm=Min('bpm'),
               max_bpm=Max('bpm'),
           )
           if stats['avg_bpm']:
               stats['avg_bpm'] = round(stats['avg_bpm'], 1)
           cache.set('heartrate_stats', stats, timeout=60)
       else:
           cache_info['stats_hit'] = True
       
       latest = cache.get('latest_reading')
       if latest is None:
           latest_obj = HeartRateReading.objects.order_by('-created_at').first()
           if latest_obj:
               latest = {'id': latest_obj.id, 'bpm': latest_obj.bpm}
               cache.set('latest_reading', latest, timeout=30)
       else:
           cache_info['latest_hit'] = True
       
       return Response({
           'cache_info': cache_info,
           'stats': stats,
           'latest': latest,
           'tip': 'Refresh the page to see cache hits. Check the Cache panel!',
       })
   
   
   @api_view(['POST'])
   def signals_demo(request):
       """
       Creates a reading to trigger signals. Check the Signals panel!
       """
       import random
       
       bpm = request.data.get('bpm', random.randint(60, 180))
       
       reading = HeartRateReading.objects.create(
           sensor_timestamp=int(time.time() * 1_000_000_000),
           bpm=bpm,
           rr_interval=int(60000 / bpm),
       )
       
       signals_fired = ['pre_save', 'post_save']
       if bpm > 150:
           signals_fired.append('high_bpm_detected (custom)')
       
       return Response({
           'created': {'id': reading.id, 'bpm': reading.bpm},
           'signals_fired': signals_fired,
           'cache_invalidated': ['heartrate_stats', 'latest_reading'],
       })
   
   
   @api_view(['DELETE'])
   def cache_clear(request):
       """Clear the cache."""
       cache.delete('heartrate_stats')
       cache.delete('latest_reading')
       return Response({'message': 'Cache cleared'})
   ```

5. **Add URLs:**
   
   Update `polarh10-backend/heartrate/urls.py`:
   ```python
   from .views import (
       HeartRateViewSet,
       sql_inefficient,
       sql_optimized,
       cache_demo,
       signals_demo,
       cache_clear,
   )
   
   urlpatterns = [
       path('debug/sql-inefficient/', sql_inefficient, name='sql_inefficient'),
       path('debug/sql-optimized/', sql_optimized, name='sql_optimized'),
       path('debug/cache/', cache_demo, name='cache_demo'),
       path('debug/cache/clear/', cache_clear, name='cache_clear'),
       path('debug/signals/', signals_demo, name='signals_demo'),
       path('', include(router.urls)),
   ]
   ```

6. **Test cache behavior:**
   
   Open http://localhost:8000/api/debug/cache/ in your browser.
   
   - **First visit:** `cache_info` shows `stats_hit: false` (cache miss)
   - **Refresh (F5):** Now `stats_hit: true` (cache hit!)
   - Check the **Cache** panel to see all cache operations

7. **Test signals:**
   
   Open http://localhost:8000/api/debug/signals/ in your browser.
   
   The DRF Browsable API has a form at the bottom. Enter:
   ```json
   {"bpm": 75}
   ```
   Click POST.
   
   The API response shows which signals were triggered:
   ```json
   {
       "signals_fired": ["pre_save", "post_save"],
       "cache_invalidated": ["heartrate_stats", "latest_reading"]
   }
   ```
   
   Try again with high BPM:
   ```json
   {"bpm": 165}
   ```
   The response will show `high_bpm_detected (custom)` was fired. Check the terminal/console for the log message: `HIGH BPM ALERT: 165 BPM!`

8. **See how frontend activity affects cache:**
   
   With the frontend running:
   1. Open http://localhost:8000/api/debug/cache/ - note the cache status
   2. The frontend is constantly fetching new data
   3. If new readings are being created, the `post_save` signal invalidates the cache
   4. Refresh the cache demo page - you might see cache misses if data changed

### Key Concepts

- **Django Signals:** Decouple event handling from the code that triggers events
- **Cache Invalidation:** Signals can automatically clear stale cache entries
- **Cache Panel:** Shows get/set/delete operations and hit/miss status
- **Signals Panel:** Shows all registered signal receivers in your application (not a log of fired signals)

---

## Task 4: Performance Profiling

### Overview
Use the Debug Toolbar's Profiling panel to analyze Python code execution and identify performance bottlenecks.

### Step-by-Step Instructions

1. **Create an endpoint with demanding operations:**
   
   Add to `polarh10-backend/heartrate/views.py`:
   ```python
   @api_view(['GET'])
   def performance_demo(request):
       """
       Simulates demanding operations.
       """
       import time
   
       results = []
   
       # Simulate demanding operations
       time.sleep(3)
   
       return Response({
           'results': results,
           'tip': 'Check Profiling panel',
       })
   ```

2. **Add the URL:**
   
   Update `polarh10-backend/heartrate/urls.py`:
   ```python
   from .views import (
       HeartRateViewSet,
       sql_inefficient,
       sql_optimized,
       cache_demo,
       signals_demo,
       cache_clear,
       performance_demo,
   )
   
   urlpatterns = [
       path('debug/sql-inefficient/', sql_inefficient, name='sql_inefficient'),
       path('debug/sql-optimized/', sql_optimized, name='sql_optimized'),
       path('debug/cache/', cache_demo, name='cache_demo'),
       path('debug/cache/clear/', cache_clear, name='cache_clear'),
       path('debug/signals/', signals_demo, name='signals_demo'),
       path('debug/performance/', performance_demo, name='performance_demo'),
       path('', include(router.urls)),
   ]
   ```

3. **Test the endpoint:**
   
   Open http://localhost:8000/api/debug/performance/ in your browser.
   
   The request will take about 3 seconds. Once loaded, click on the **Profiling** panel.

4. **Reading the Profiling panel:**
   
   The Profiling panel shows a call tree with these columns:
   
   | Column | Description |
   |--------|-------------|
   | **CumTime** | Total time in function INCLUDING calls to other functions |
   | **TotTime** | Time spent ONLY in this function (excluding sub-calls) |
   | **Per** | Time per single call |
   | **Count** | Number of times the function was called |
   
   **How to find bottlenecks:**
   - Look for functions with high **TotTime** - these are your actual bottlenecks
   - High **CumTime** but low **TotTime** means the function itself is fast, but it calls slow functions
   - High **Count** with small **Per** time can add up - consider optimizing frequently called code
   
   In our example, you should see `time.sleep` with ~3 seconds in TotTime.

5. **Profile the main API endpoints:**
   
   Open the endpoints the frontend uses and check the Profiling panel:
   - http://localhost:8000/api/heartrate/
   - http://localhost:8000/api/heartrate/stats/
   
   Compare the Profiling panel with the SQL panel to understand where time is spent.

### Key Concepts

- **Profiling Panel:** Shows Python function call hierarchy and timing
- **TotTime:** The key metric for finding bottlenecks - time spent in the function itself
- **CumTime:** Total time including all sub-calls
- **SQL Panel:** For database query performance (often the main bottleneck in web apps)

---

## Summary

### Debug Toolbar Panels Quick Reference

| Panel | Use For |
|-------|---------|
| **History** | Compare requests, investigate frontend API calls |
| **Time** | Request timing |
| **SQL** | Query analysis, find N+1 problems |
| **Headers** | HTTP debugging, CORS issues |
| **Cache** | Cache hit/miss analysis |
| **Signals** | Track Django signals |
| **Profiling** | Python performance profiling |

### Best Practices

1. **Never use Debug Toolbar in production** - it exposes sensitive data
2. **Use History panel** to investigate frontend-triggered requests
3. **Check SQL panel regularly** to catch inefficient queries early
4. **Profile before optimizing** - measure, don't guess
5. **Use cache wisely** - invalidate when data changes (signals help!)

---

END LAB
