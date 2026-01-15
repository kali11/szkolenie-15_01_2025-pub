# Sentry Monitoring Best Practices Workshop


### Learning Objectives

By the end of this workshop, you will be able to:
- Add context that makes errors actually debuggable (not just "something broke")
- Navigate Sentry's interface efficiently to find root causes fast
- Build dashboards that show your team exactly what's happening
- Implement workflows that actually get bugs fixed (not ignored)
- Set up ownership rules so the right person gets notified
- Use performance monitoring to find slow spots

### Prerequisites

- Completed "Sentry Setup & Basic Integration" workshop
- Sentry SDK installed in both backend and frontend
- Access to Sentry dashboard

---

## Task 1: Quick Wins — Make Your Errors Actually Useful

### Overview
Right now, your Sentry errors probably look like this:
```
ValueError: invalid literal for int() with base 10: 'abc'
```

Useful? Barely. You know *what* broke but not *why* or *for whom*.

In this task, you'll add context that transforms cryptic errors into complete debugging stories.

### The Goal
Turn "something broke" into "User X clicked button Y while viewing page Z, which called API endpoint A with these parameters..."

### Step-by-Step Instructions

#### 1. Add User Context (Who experienced this error?)

When an error happens, you want to know: Was this an admin? A new user? Someone who's been on the site for 2 hours?

**Backend — File: `polarh10-backend/heartrate/views.py`**

Add an `initial` method inside your `HeartRateViewSet` class. This method runs for every request:

```python
# Add this import at the top of the file (with other imports)
import sentry_sdk

# Add this method inside the HeartRateViewSet class, after the class definition line
def initial(self, request, *args, **kwargs):
    """Set Sentry context for every request."""
    super().initial(request, *args, **kwargs)
    
    # Set user context (use actual user if authenticated)
    if request.user.is_authenticated:
        sentry_sdk.set_user({
            "id": str(request.user.id),
            "email": request.user.email,
            "username": request.user.username,
        })
    else:
        # For anonymous users, create a session-based identifier
        session_id = request.session.session_key or "anonymous"
        sentry_sdk.set_user({"id": f"anon-{session_id[:8]}"})
    
    # Add useful tags for filtering
    sentry_sdk.set_tag("api.endpoint", request.path)
    sentry_sdk.set_tag("api.method", request.method)
```

**Frontend — File: `polarh10-frontend/src/app/page.tsx`**

Add this function and call it in your component's `useEffect`:

```typescript
// Add this import at the top of the file
import { useState, useEffect } from "react";
import * as Sentry from '@sentry/nextjs';

// Add this function before the Dashboard component
function setSentryUserContext() {
  // If you have authentication, use real user data
  const userId = localStorage.getItem('userId') || 'anonymous';
  
  Sentry.setUser({
    id: userId,
    // Add more when available:
    // email: user.email,
    // username: user.name,
  });
  
  // Add session context
  Sentry.setTag('session.start', new Date().toISOString());
  Sentry.setTag('viewport', `${window.innerWidth}x${window.innerHeight}`);
}

// Then call setSentryUserContext() in your component's useEffect:

export default function Dashboard() {
    // ...
    useEffect(() => { setSentryUserContext(); }, []);
    // ...
}
```

#### 2. Add Breadcrumbs (What happened before the error?)

Breadcrumbs are the "trail of events" leading up to an error. They answer: "What was the user doing?"

**Frontend — File: `polarh10-frontend/src/hooks/useHeartRate.ts`**

Add breadcrumbs inside the `fetchData` function to track data fetching:

```typescript
// Add this import at the top of the file
import * as Sentry from '@sentry/nextjs';

// Add these breadcrumbs inside the fetchData function:

const fetchData = useCallback(async () => {
    // Add breadcrumb for data fetch
    Sentry.addBreadcrumb({
      category: 'data',
      message: 'Fetching heart rate data',
      level: 'info',
      data: {
        historyMinutes: historyMinutesRef.current,
        refreshInterval,
      },
    });
    try {
      const [latestData, statsData, historyData] = await Promise.all([
        getLatestReading().catch(() => null),
        getHeartRateStats(historyMinutesRef.current),
        getHeartRateReadings(historyMinutesRef.current),
      ]);

      // Add breadcrumb for successful fetch
      Sentry.addBreadcrumb({
        category: 'data',
        message: 'Heart rate data fetched successfully',
        level: 'info',
        data: {
          latestBpm: latestData?.bpm,
          readingCount: historyData.results?.length || 0,
          avgBpm: statsData?.avg_bpm,
        },
      });

      if (latestData) {
        setLatestReading(latestData);
      }
      setStats(statsData);
      setHistory(historyData.results || []);
      setError(null);
      setIsConnected(true);
      lastSuccessfulFetchRef.current = Date.now();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);

      // Add Breadcrumb when data fetch failed
      Sentry.addBreadcrumb({
        category: 'data',
        message: 'Heart rate data fetch failed',
        level: 'error',
        data: {
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      });

      // Consider disconnected if we haven't had a successful fetch in 5 seconds
      if (Date.now() - lastSuccessfulFetchRef.current > 5000) {
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies - uses refs
```

**Backend — File: `polarh10-backend/heartrate/views.py`**

Add breadcrumbs to the existing `stats` method inside `HeartRateViewSet`:

```python
# The import should already exist, if not add it at the top:
import sentry_sdk

# Update the stats method to include breadcrumbs:
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get aggregated statistics."""
    
    # Add this at the START of the method - track what we're about to do
    sentry_sdk.add_breadcrumb(
        category='api',
        message='Calculating heart rate statistics',
        level='info',
        data={
            'minutes': request.query_params.get('minutes'),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:50],
        }
    )
    
    queryset = self.get_queryset()
    
    # Add this after getting the queryset - track the query results
    sentry_sdk.add_breadcrumb(
        category='db',
        message=f'Query returned {queryset.count()} readings',
        level='info',
    )
    
    # ... rest of the existing method code (aggregate, serializer, return Response)
```

#### 3. Add Custom Context (What state was the app in?)

Context is structured data that helps you understand the situation.

**Backend — File: `polarh10-backend/heartrate/views.py`**

Add this inside the `stats` method, after the queryset is fetched:

```python
# Add this after: queryset = self.get_queryset()
sentry_sdk.set_context('request_details', {
    'minutes_param': request.query_params.get('minutes'),
    'query_count': queryset.count(),
    'time_range': {
        'start': str(queryset.first().created_at) if queryset.exists() else None,
        'end': str(queryset.last().created_at) if queryset.exists() else None,
    }
})

# # Add this after getting the queryset - track the query results
# sentry_sdk.add_breadcrumb(
#     category='db',
#     message=f'Query returned {queryset.count()} readings',
#     level='info',
# ...
```

**Frontend — File: `polarh10-frontend/src/hooks/useHeartRate.ts`**

Add this inside the `fetchData` function, after successful data fetch:

```typescript
// Add this after setting state (setHistory, setStats, etc.)
Sentry.setContext('app_state', {
  isConnected: true,
  lastDataFetch: new Date().toISOString(),
  readingsCount: historyData.results?.length || 0,
  currentView: 'dashboard',
});
```

#### 4. Test It — Create a Rich Error

**File: `polarh10-backend/heartrate/views.py`**

Add this test endpoint inside the `HeartRateViewSet` class (after the existing methods):

```python
@action(detail=False, methods=['get'])
def rich_error_test(self, request):
    """
    Test endpoint that demonstrates rich error context.
    DELETE THIS IN PRODUCTION.
    """
    import sentry_sdk
    
    # Simulate a user journey
    sentry_sdk.add_breadcrumb(
        category='navigation',
        message='User opened dashboard',
        level='info'
    )
    
    sentry_sdk.add_breadcrumb(
        category='user-action', 
        message='User clicked refresh button',
        level='info'
    )
    
    sentry_sdk.add_breadcrumb(
        category='api',
        message='Fetching heart rate data',
        level='info',
        data={'minutes': 5}
    )
    
    # Set context
    sentry_sdk.set_context('app_state', {
        'readings_in_view': 150,
        'last_bpm': 72,
        'connection_status': 'connected',
    })
    
    sentry_sdk.set_tag('feature', 'dashboard')
    sentry_sdk.set_tag('user_plan', 'free')
    
    # Now trigger an error
    raise ValueError("Example error with full context")
```

Test it:
```bash
curl http://localhost:8000/api/heartrate/rich_error_test/
```

You should see loads of errors in console ;)

#### 5. See the Difference in Sentry

Go to your Sentry dashboard and open this error. Notice:

1. **Tags** (right sidebar) — Filterable metadata like `feature:dashboard`
2. **User** section — Who experienced this
3. **Breadcrumbs** section — The trail of events before the crash
4. **Additional Data** — Your custom context

**This is the difference between "something broke" and "I know exactly what happened."**

**See the same for frontend dashboard.** Trigger error and lookthrough issue details.

### Key Insight

Adding context takes 5 minutes. Debugging without context takes 5 hours.

---

## Task 2: Investigating Errors — Master the Sentry Interface

### Overview
A user reports: "The app is broken." 

Without Sentry: You ask 20 questions, try to reproduce, check logs, guess...

With Sentry: You find the error, see exactly what happened, fix it.

This task teaches you to navigate Sentry's interface efficiently.

### The Scenario

Let's create a realistic scenario for investigation practice. 

**Add this endpoint to `polarh10-backend/heartrate/views.py`** (inside the `HeartRateViewSet` class, after the existing methods):

```python
@action(detail=False, methods=['get'])
def process_batch(self, request):
    """
    Simulates batch processing that sometimes fails.
    This creates realistic errors for debugging practice.
    """
    import sentry_sdk
    import random

    batch_id = request.query_params.get('batch_id', f'BATCH-{random.randint(1000,9999)}')
    batch_size = int(request.query_params.get('size', 50))

    # Set identifying information
    sentry_sdk.set_tag('batch_id', batch_id)
    sentry_sdk.set_tag('batch_size', str(batch_size))

    sentry_sdk.set_context('batch_info', {
        'batch_id': batch_id,
        'requested_size': batch_size,
        'timestamp': str(timezone.now()),
        'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown'),
    })

    # Simulate processing steps
    sentry_sdk.add_breadcrumb(
        category='batch',
        message=f'Starting batch {batch_id}',
        level='info',
        data={'size': batch_size}
    )

    processed = 0

    try:
        for i in range(batch_size):
            processed += 1
            
            # Simulate fake reading data
            fake_bpm = random.randint(50, 180)
            fake_rr_interval = random.randint(200, 1200)

            # Simulate random failures (10% chance)
            if random.random() < 0.1:
                sentry_sdk.add_breadcrumb(
                    category='batch',
                    message=f'Processing reading {processed}/{batch_size}',
                    level='info',
                    data={'reading_id': processed, 'bpm': fake_bpm}
                )

                # Different failure types based on simulated data
                if fake_bpm > 150:
                    raise ValueError(f"BPM {fake_bpm} exceeds safe threshold")
                elif fake_rr_interval < 300:
                    raise RuntimeError(f"Invalid RR interval: {fake_rr_interval}ms")
                else:
                    raise Exception(f"Processing failed at reading {processed}")

    except Exception as e:
        # Explicitly capture and send to Sentry
        sentry_sdk.capture_exception(e)
        return Response({
            'batch_id': batch_id,
            'processed': processed,
            'status': 'error',
            'error': str(e)
        }, status=500)

    return Response({
        'batch_id': batch_id,
        'processed': processed,
        'status': 'success'
    })
```

### Generate Test Errors

Run these multiple times to create a variety of errors:

```bash
# Different batch sizes
curl "http://localhost:8000/api/heartrate/process_batch/?batch_id=BATCH-001&size=50"
curl "http://localhost:8000/api/heartrate/process_batch/?batch_id=BATCH-002&size=100"
curl "http://localhost:8000/api/heartrate/process_batch/?batch_id=BATCH-003&size=200"

# Run each command 3-4 times to generate multiple errors
```

### Expected Results

With a 10% failure rate per iteration, you should see errors fairly quickly. Here's what to expect:

**Error response (when failure is triggered):**
```json
{
  "batch_id": "BATCH-001",
  "processed": 7,
  "status": "error",
  "error": "BPM 163 exceeds safe threshold"
}
```

**Success response (when no failure occurs):**
```json
{
  "batch_id": "BATCH-001",
  "processed": 50,
  "status": "success"
}
```

> 💡 **Tip:** If you keep getting success responses, increase the batch size (`size=200`) to increase the chance of hitting an error. With 200 iterations at 10% failure rate, you're almost guaranteed to hit one!

**Verify in Sentry:**
1. Open your Sentry dashboard → **Issues** tab
2. You should see new issues like:
   - `ValueError: BPM 163 exceeds safe threshold`
   - `RuntimeError: Invalid RR interval: 245ms`
   - `Exception: Processing failed at reading 12`
3. Click on an issue to see the rich context we added (tags, breadcrumbs, context)

### Navigate the Sentry Interface

Now let's explore. Open your Sentry dashboard.

#### Step 1: The Issues List

Go to **Issues**. This is your starting point.

**Quick filters (search at top):**
- **is:unresolved** — Everything that needs attention

**Try these searches (one by one):**
```
# Find errors from large batches
batch_size:200

# Find specific error types  
error.type:ValueError

# Find errors containing specific text
"exceeds safe threshold"

# Find recent errors (not occuring before)
firstSeen:-1h

# Combine filters
batch_size:100 error.type:RuntimeError
```

#### Step 2: The Issue Detail Page

Click on any error. Let's explore each section:

**A. The Header:**
- **Events count** — How many times this happened
- **Users count** — How many people affected
- **First/Last seen** — When it started and if it's ongoing

**B. Stack Trace (main panel):**
- Look for **local variables** (You may need to click `Show More`)
- Toggle between "Raw" and "Full" views

**C. Breadcrumbs (scroll down):**
- This is the "story" of what happened
- Check timestamps — how long between steps?
- Filter by category if it's noisy

**D. Tags:**
- Click on `...` on any tag to search for similar issues
- Your custom tags like `batch_id` appear here
- Use these to find patterns
- Use tabs to filter between `All` / `Custom` / `Application` / `Client` / `Other`

**E. Additional Data / Context:**
- Your `set_context` data appears here
- Full details about the request state

#### Step 3: Finding Patterns

The real power is finding patterns across errors:

1. **Compare Events:**
   - On an issue page, use the `<` `>` arrows to browse through individual occurrences
   - Notice: Are they all from the same batch size? Same time of day?

2. **Use the Event Graph:**
   - At the top of the issue, there's a timeline showing when events occurred
   - Spikes might indicate a deployment or external service issue

3. **Click `View all tags and feature flags` to investigate patterns** 
   - You can also filter using search box.

### Key Takeaways

- **The Issues page is your inbox** — Treat it like email, aim for inbox zero
- **Tags are for filtering** — Use them to find patterns
- **Breadcrumbs tell the story** — The sequence of events is often more valuable than the stack trace
- **Context is for deep dives** — Structured data for when you need to understand state

---


## Task 3: Build a Dashboard Your Team Will Actually Use

### Overview
Dashboards transform Sentry from "a place errors go to die" into a monitoring tool everyone checks.

The goal: Create a dashboard that answers "Is our app healthy?" in 5 seconds.

### Create Your Dashboard

Go to **Dashboards** → **Create Dashboard**

Name it: **"Heart Rate App Health"**

### Widget 1: The Big Number — "Are We on Fire?"

Click **Add Widget**:
- **Type:** Big Number
- **Display Name:** "Errors"
- **Dataset:** Errors
- **Query:** `count()`

Set thresholds:
0-5 - Green
5-15 - Yellow
15+ red

This gives you an instant answer to "how many errors today?"

### Widget 2: Error Trend — "Getting Better or Worse?"

Add another widget:
- **Type:** Area Chart
- **Display Name:** "Error Trend"
- **Y-Axis:** `count()`
- **Group By:** None

This shows you if errors are increasing or decreasing.

### Widget 3: Top Issues — "What Needs Fixing?"

Add another widget:
- **Type:** Table
- **Display Name:** "Top Issues to Fix"
- **Columns:** 
  - `events` 
  - `title`
  - `lastSeen`
  - `issue`
- **Sort:** By events, High to low

This shows you which errors to prioritize.

### Widget 4: Users Affected — "Is This Serious?"

Add another widget:
- **Type:** Big Number
- **Display Name:** "Users Affected"
- **Query:** `count_unique(user.id)`

This quantifies the human impact.

### Widget 5: Errors by Endpoint

- **Type:** Bar Chart
- **Display Name:** "Errors by Endpoint"
- **Y-Axis:** `count()`
- **Group By:** `transaction`
- **Limit:** 5

This shows which parts of your app are most problematic.

### Save and Share

- Click **Save**
- Bookmark this dashboard
- Share the URL with your team

### The Morning Check

Start each day with a 30-second dashboard check:
1. **Errors count:** Up or down from yesterday?
2. **Top issues:** Anything new in the list?
3. **Trend:** Any spikes that need investigation?

This prevents "death by a thousand cuts" — small issues that pile up unnoticed.


## Task 4: Performance Monitoring — Find the Slow Spots

### Overview
Errors tell you what *broke*. Performance monitoring tells you what's *slow*.

Slow isn't broken, but it makes users unhappy. And slow often leads to errors (timeouts, retries, frustrated users clicking repeatedly).

### Enable Performance Tracing

Your backend should already have tracing enabled from the setup lab. 

**File: `polarh10-backend/config/sentry_config.py`** — Verify this is set in `sentry_sdk.init()`:

```python
traces_sample_rate=1.0,  # 100% for development, reduce to 0.1-0.25 in production
```

### Add Custom Spans

Spans show you where time is spent within a request.

**File: `polarh10-backend/heartrate/views.py`**

First, add the import at the top of the file:

```python
from sentry_sdk import start_span
```

Then update the `stats` method to wrap operations in spans:

```python
@action(detail=False, methods=['get'])
def stats(self, request):
    """Get stats with performance tracing."""
    
    # Track database query time
    with start_span(op="db.query", description="aggregate_stats") as span:
        queryset = self.get_queryset()
        
        stats = queryset.aggregate(
            count=Count('id'),
            avg_bpm=Avg('bpm'),
            min_bpm=Min('bpm'),
            max_bpm=Max('bpm'),
        )
        
        # Add context to the span
        span.set_data("reading_count", stats['count'])
    
    # Track serialization time  
    with start_span(op="serialize", description="format_response"):
        if stats['avg_bpm']:
            stats['avg_bpm'] = round(stats['avg_bpm'], 1)
        
        serializer = HeartRateStatsSerializer(stats)
        response_data = serializer.data
    
    return Response(response_data)
```

### View Performance Data

Make several requests:
```bash
curl http://localhost:8000/api/heartrate/stats/?minutes=5
curl http://localhost:8000/api/heartrate/stats/?minutes=30
curl http://localhost:8000/api/heartrate/stats/?minutes=60
```

In Sentry, go to **Insights**:
- Go to backend
- (On bottom) Click a transaction to see the span waterfall

### What to Look For

- **P95 vs P50:** If P95 is much higher than P50, you have outliers
- **Slow spans:** Which operation takes the most time?
- **N+1 queries:** Many small database spans instead of one big one
- **External calls:** API calls to other services are often the bottleneck

### Example dashboards
- Go to Dashboards
- Preview Backend and General Template for inspiration. :) 

---

## What's Next?

Apply this to your real projects:

1. **Add context** to your most error-prone code paths
2. **Create a dashboard** for your team
3. **Set up ownership rules** so the right people get notified
4. **Start the weekly review ritual** 

Remember: Sentry isn't just for collecting errors. It's for *fixing* them.

---

END LAB
