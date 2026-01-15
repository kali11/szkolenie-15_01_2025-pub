# Sentry Setup & Basic Integration Workshop

## Workshop Overview

In this practical workshop, you will learn how to integrate Sentry error monitoring into a full-stack application consisting of a Django REST API backend and a Next.js frontend. You'll configure error capture, set up source maps for readable stack traces, implement breadcrumbs for debugging context, and configure alerts for production monitoring.

### Learning Objectives

By the end of this workshop, you will be able to:
- Install and configure Sentry SDK for both Django (Python) and Next.js (JavaScript)
- Set up error capture with proper exception handling
- Configure event sampling to control data volume and costs
- Implement release tracking for correlating errors with deployments
- Set up environment separation (development, staging, production)
- Configure alerting rules for critical error notifications
- Upload source maps for readable JavaScript stack traces
- Implement custom breadcrumbs for enhanced debugging context

---

## Task 1: Sentry Account Setup and Project Creation

### Overview
Create a Sentry account and set up projects for both the Django backend and Next.js frontend. Each application should have its own project to keep errors organized and allow for application-specific configurations.

### Step-by-Step Instructions

1. **Create a Sentry account:**
   
   Navigate to [sentry.io](https://sentry.io) and create a free account:
   - Click "Get Started Free"
   - Sign up with your email or GitHub account
   - Complete the registration process

2. **Create an organization:**
   
   After registration, you'll be prompted to create an organization:
   - Organization name: `polarh10-workshop` (or your preferred name)
   - This organization will contain all your projects

3. **Create the Django backend project:**
   
   - Click "Create Project" in the Sentry dashboard
   - Select **Django** as the platform
   - Set the alert frequency to "Alert me on high priority issues"
   - Project name: `polarh10-backend`
   - Click "Create Project"
   
   **Important:** Copy the DSN (Data Source Name) that appears. It looks like:
   ```
   https://abc123@o123456.ingest.sentry.io/1234567
   ```
   Save this as `SENTRY_BACKEND_DSN` - you'll need it later.

4. **Create the Next.js frontend project:**
   
   - Click "Create Project" again
   - Select **Next.js** as the platform
   - Set alert frequency to "Alert me on high priority issues"
   - Project name: `polarh10-frontend`
   - Click "Create Project"
   
   Copy and save this DSN as `SENTRY_FRONTEND_DSN`.

5. **Note your organization slug:**
   
   Find your organization slug in the URL. For example:
   ```
   https://your-org.sentry.io/...
   ```
   The slug is `your-org`. You'll need this for source maps configuration.

6. **Create an Auth Token:**
   
   - Go to **Settings** → **Personal Tokens** (under Developer Settings)
   - Click "Create New Token"
   - Give it a name like "workshop-token"
   - Select scopes: `project:admin`, `release:admin`, `organization:read`
   - Click "Create Token"
   - **Copy and save this token securely** - you won't see it again!

### Key Concepts

- **DSN (Data Source Name):** A unique identifier that tells the Sentry SDK where to send events. Contains project ID and authentication info.
- **Organization:** A container for related projects, team members, and billing. Typically one per company.
- **Project:** Represents a single application or service. Errors are grouped and tracked per project.
- **Auth Token:** Used for API access, releasing, and uploading source maps. Keep it secret!

---

## Task 2: Django Backend Sentry Integration

### Overview
Install and configure the Sentry SDK for the Django backend. You'll set up error capture, configure environment variables, and implement release tracking.

### Step-by-Step Instructions

1. **Navigate to the backend directory and activate the virtual environment:**
   ```bash
   cd polarh10-backend
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Install the Sentry SDK:**
   ```bash
   pip install sentry-sdk[django]
   ```
   
   Update `requirements.txt` to include:
   ```
   sentry-sdk[django]==2.19.2
   ```

3. **Create a Sentry configuration file:**
   
   Create `polarh10-backend/config/sentry_config.py`:
   
   ```python
   """
   Sentry configuration for polarh10-backend.
   """
   
   import os
   import sentry_sdk
   from sentry_sdk.integrations.django import DjangoIntegration
   from sentry_sdk.integrations.logging import LoggingIntegration
   import logging
   
   
   def get_release_version():
       """
       Get the release version from environment or git.
       In production, this should be set via CI/CD.
       """
       # Try environment variable first (set in CI/CD)
       release = os.environ.get('SENTRY_RELEASE')
       if release:
           return release
       
       # Try reading from a VERSION file
       try:
           with open('VERSION', 'r') as f:
               return f.read().strip()
       except FileNotFoundError:
           pass
       
       # Default for development
       return 'polarh10-backend@dev'
   
   
   def init_sentry():
       """
       Initialize Sentry SDK with Django integration.
       """
       dsn = os.environ.get('SENTRY_DSN')
       
       if not dsn:
           print("⚠️  SENTRY_DSN not set. Sentry error tracking disabled.")
           return
       
       environment = os.environ.get('SENTRY_ENVIRONMENT', 'development')
       release = get_release_version()
       
       # Configure logging integration
       logging_integration = LoggingIntegration(
           level=logging.INFO,        # Capture INFO and above as breadcrumbs
           event_level=logging.ERROR  # Send ERROR and above as events
       )
       
       sentry_sdk.init(
           dsn=dsn,
           
           # Integrations
           integrations=[
               DjangoIntegration(
                   transaction_style='url',  # Use URL pattern for transaction names
                   middleware_spans=True,     # Create spans for middleware
               ),
               logging_integration,
           ],
           
           # Environment configuration
           environment=environment,
           release=release,
           
           # Event sampling (1.0 = 100% of errors)
           # Reduce in production if you have high traffic
           sample_rate=1.0,
           
           # Performance monitoring sample rate
           # Start with 0.1 (10%) in production
           traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '1.0')),
           
           # Profile sample rate (relative to traces)
           profiles_sample_rate=float(os.environ.get('SENTRY_PROFILES_SAMPLE_RATE', '0.1')),
           
           # Send default PII (disable in production with strict privacy requirements)
           send_default_pii=os.environ.get('SENTRY_SEND_PII', 'False').lower() == 'true',
           
           # Attach stack traces to messages
           attach_stacktrace=True,
           
           # Server name (useful for multi-server deployments)
           server_name=os.environ.get('HOSTNAME', 'localhost'),
           
           # Before send hook for data scrubbing
           before_send=before_send_handler,
           
           # Before breadcrumb hook
           before_breadcrumb=before_breadcrumb_handler,
       )
       
       print(f"✅ Sentry initialized: env={environment}, release={release}")
   
   
   def before_send_handler(event, hint):
       """
       Process events before sending to Sentry.
       Use this for data scrubbing, filtering, or enrichment.
       """
       # Example: Don't send events in development for certain errors
       if os.environ.get('SENTRY_ENVIRONMENT') == 'development':
           # Skip common development errors
           exception = hint.get('exc_info')
           if exception:
               exc_type, exc_value, _ = exception
               if exc_type.__name__ in ['ConnectionRefusedError']:
                   return None  # Don't send this event
       
       return event
   
   
   def before_breadcrumb_handler(breadcrumb, hint):
       """
       Process breadcrumbs before adding to events.
       Use this to filter sensitive information from breadcrumbs.
       """
       # Filter out sensitive SQL queries
       if breadcrumb.get('category') == 'query':
           # Remove the actual data from SQL queries
           if 'data' in breadcrumb:
               breadcrumb['data'] = {'query': '[FILTERED]'}
       
       return breadcrumb
   ```

4. **Update Django settings to initialize Sentry:**
   
   Open `polarh10-backend/config/settings.py` and add at the end:
   
   ```python
   # Sentry configuration
   from config.sentry_config import init_sentry
   init_sentry()
   ```

5. **Create environment file for local development:**
   
   Create `polarh10-backend/.env`:
   
   ```bash
   # Sentry Configuration
   SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
   SENTRY_ENVIRONMENT=development
   SENTRY_RELEASE=polarh10-backend@1.0.0
   SENTRY_TRACES_SAMPLE_RATE=1.0
   SENTRY_PROFILES_SAMPLE_RATE=0.1
   SENTRY_SEND_PII=false

   # Edit .env and add your SENTRY_DSN (Projects -> Django -> Settings -> SDK Setup -> Client Keys (DSN))
   ```

6. **Install python-dotenv for environment variables:**
   ```bash
   pip install python-dotenv
   ```
   
   Add to `requirements.txt`:
   ```
   python-dotenv==1.0.1
   ```
   
   Update `polarh10-backend/config/settings.py` to load `.env`:
   
   Add at the very top, after imports:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

7. **Add a test endpoint to verify Sentry integration:**
   
   Add to `polarh10-backend/heartrate/views.py`:
   
   ```python
   @action(detail=False, methods=['get'])
   def sentry_test(self, request):
       """
       Test endpoint to verify Sentry integration.
       DELETE THIS IN PRODUCTION.
       
       Usage:
           GET /api/heartrate/sentry_test/           - Trigger a test error
           GET /api/heartrate/sentry_test/?type=msg  - Send a test message
       """
       import sentry_sdk
       
       test_type = request.query_params.get('type', 'error')
       
       if test_type == 'msg':
           # Capture a message (not an exception)
           sentry_sdk.capture_message(
               "Test message from Polar H10 Backend",
               level="info"
           )
           return Response({'status': 'Message sent to Sentry'})
       
       # Trigger a test exception
       try:
           division_by_zero = 1 / 0
       except Exception as e:
           sentry_sdk.capture_exception(e)
           return Response({'status': 'Error captured and sent to Sentry'})
   ```

8. **Test the Sentry integration:**
   
   Start the Django server:
   ```bash
   python manage.py runserver
   ```
   
   Trigger a test error:
   ```bash
   # Send a test exception
   curl http://localhost:8000/api/heartrate/sentry_test/
   
   # Send a test message
   curl "http://localhost:8000/api/heartrate/sentry_test/?type=msg"
   ```
   
   Check your Sentry dashboard - you should see:
   - A `ZeroDivisionError` in the Issues view
   - A test message in the Issues view (filtered to "Info" level)

9. **Verify release tracking:**
   
   In the Sentry dashboard, go to **Releases**. You should see your release version listed.

### Key Concepts

- **DjangoIntegration:** Automatically captures unhandled exceptions, adds request context, and creates transactions for requests.
- **Sample Rate:** Controls what percentage of events are sent. Use 1.0 for development, lower for high-traffic production.
- **Release:** Associates errors with a specific version of your code. Essential for tracking regressions.
- **Environment:** Separates errors by deployment environment (development, staging, production).
- **before_send:** Hook to modify or filter events before sending. Use for data scrubbing.
- **before_breadcrumb:** Hook to filter sensitive data from the breadcrumb trail.

---

## Task 3: Next.js Frontend Sentry Integration

### Overview
Install and configure the Sentry SDK for the Next.js frontend, including automatic source map uploading for readable stack traces.

### Step-by-Step Instructions

1. **Navigate to the frontend directory:**
   ```bash
   cd polarh10-frontend
   ```

2. **Install Sentry using the wizard (recommended):**
   
   The Sentry wizard automatically configures Next.js with optimal settings:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
   
   During setup:
   - Select your Sentry project (`polarh10-frontend`)
   - Allow it to create configuration files
   - Are you using Sentry SaaS or self-hosted Sentry?: Sentry SaaS (sentry.io)
   - Do you already have a Sentry account?: Yes
   - Log in
   - Do you want to route Sentry requests in the browser through your Next.js server to avoid ad blockers?: Yes
   - Do you want to enable Tracing to track the performance of your application?: Yes
   - Do you want to enable Session Replay to get a video-like reproduction of errors during a user session? No
   - Do you want to enable Logs to send your application logs to Sentry?: Yes
   - Are you using a CI/CD tool to build and deploy your application?: No
   - Optionally add a project-scoped MCP server configuration for the Sentry MCP?: No
   - It will create `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`

3. **Alternative: Manual installation (if wizard doesn't work):**
   
   If the wizard fails, install manually:
   ```bash
   npm install @sentry/nextjs
   ```
   
   Create `polarh10-frontend/sentry.client.config.ts`:
   
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     
     // Environment and release
     environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
     release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
     
     // Sample rates
     tracesSampleRate: 1.0,  // Capture 100% of transactions for development
     replaysSessionSampleRate: 0.1,  // Sample 10% of sessions for replay
     replaysOnErrorSampleRate: 1.0,  // Sample 100% of sessions with errors
     
     // Enable debug mode in development
     debug: process.env.NODE_ENV === "development",
     
     // Integrations
     integrations: [
       // Enable browser tracing
       Sentry.browserTracingIntegration(),
       // Enable session replay
       Sentry.replayIntegration({
         maskAllText: true,
         blockAllMedia: true,
       }),
     ],
     
     // Filter out specific errors
     ignoreErrors: [
       // Browser extensions
       /chrome-extension/,
       /moz-extension/,
       // Network errors (usually user's connection issues)
       "Network request failed",
       "Failed to fetch",
       // Common false positives
       "ResizeObserver loop",
     ],
   });
   ```
   
   Create `polarh10-frontend/sentry.server.config.ts`:
   
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     
     environment: process.env.SENTRY_ENVIRONMENT || "development",
     release: process.env.SENTRY_RELEASE,
     
     // Performance monitoring
     tracesSampleRate: 1.0,
     
     // Debug in development
     debug: process.env.NODE_ENV === "development",
   });
   ```
   
   Create `polarh10-frontend/sentry.edge.config.ts`:
   
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.SENTRY_ENVIRONMENT || "development",
     release: process.env.SENTRY_RELEASE,
     tracesSampleRate: 1.0,
   });
   ```

4. **Configure Next.js for Sentry:**
   
   Update `polarh10-frontend/next.config.ts`:
   
   ```typescript
     export default withSentryConfig(nextConfig, {
        // ... add those 4 attributes
        // Transpiles SDK to be compatible with IE11
        transpileClientSDK: true,
        
        // Hide source maps from users
        hideSourceMaps: true,
        
        // Automatically tree-shake Sentry logger statements
        disableLogger: true,
        
        // Enable automatic instrumentation
        automaticVercelMonitors: true,
    })
   ```

5. **Create error boundary with Sentry integration:**
   
   Create `polarh10-frontend/src/components/ErrorBoundary.tsx` (or update):
   
   ```tsx
   'use client';
   
   import { Component, ReactNode } from 'react';
   import * as Sentry from '@sentry/nextjs';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
     eventId: string | null;
   }
   
   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null, eventId: null };
     }
   
     static getDerivedStateFromError(error: Error): Partial<State> {
       return { hasError: true, error };
     }
   
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
       // Send error to Sentry with component stack
       Sentry.withScope((scope) => {
         scope.setExtra('componentStack', errorInfo.componentStack);
         const eventId = Sentry.captureException(error);
         this.setState({ eventId });
       });
     }
   
     handleRetry = (): void => {
       this.setState({ hasError: false, error: null, eventId: null });
     };
   
     handleReportFeedback = (): void => {
       if (this.state.eventId) {
         Sentry.showReportDialog({ eventId: this.state.eventId });
       }
     };
   
     render(): ReactNode {
       if (this.state.hasError) {
         if (this.props.fallback) {
           return this.props.fallback;
         }
   
         return (
           <div className="flex flex-col items-center justify-center p-8 bg-[var(--background-card)] rounded-2xl border border-[var(--danger)]/30">
             <div className="text-5xl mb-4">⚠️</div>
             <h2 className="text-xl font-semibold text-[var(--danger)] mb-2">
               Something went wrong
             </h2>
             <p className="text-[var(--foreground-muted)] text-center mb-4 max-w-md">
               {this.state.error?.message || 'An unexpected error occurred'}
             </p>
             <div className="flex gap-3">
               <button
                 onClick={this.handleRetry}
                 className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
               >
                 Try Again
               </button>
               {this.state.eventId && (
                 <button
                   onClick={this.handleReportFeedback}
                   className="px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--foreground-muted)] transition-colors"
                 >
                   Report Feedback
                 </button>
               )}
             </div>
             {this.state.eventId && (
               <p className="text-xs text-[var(--foreground-muted)] mt-4">
                 Error ID: {this.state.eventId}
               </p>
             )}
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

6. **Create environment files:**
   
   Create `polarh10-frontend/.env.local`:
   
   ```bash
   # Sentry Configuration
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
   NEXT_PUBLIC_SENTRY_RELEASE=polarh10-frontend@1.0.0
   
   # Sentry build-time variables (for source maps)
   SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=polarh10-frontend
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ENVIRONMENT=development
   SENTRY_RELEASE=polarh10-frontend@1.0.0
   # Edit and add your actual DSN and auth token
   ```

7. **Add a test button to the frontend:**
   
   Add a test button in `polarh10-frontend/src/app/page.tsx` temporarily (in the header, after the Enabled button):
   
   ```tsx
   <button
     onClick={() => {
       throw new Error("Test Sentry Error from Frontend");
     }}
     className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
   >
     Test Sentry
   </button>
   ```

8. **Test the frontend Sentry integration:**
   
   Start the development server:
   ```bash
   npm run dev
   ```
   
   - Open `http://localhost:3000`
   - Click the "Test Sentry" button
   - Check the Sentry dashboard for the error

9. **Build and verify source maps:**
   
   Build the production version:
   ```bash
   npm run build
   ```
   
   If source maps are configured correctly, you'll see Sentry uploading them during the build.
   
   Check **Releases** in Sentry - your release should show associated source maps. (Right hand side -> Source Maps - X artifacts)

   **Why this matters:**

    Without source maps, when an error occurs in production, you'll see minified code like:
    ```
    Error at t.forEach (page-abc123.js:1:2847)
    ```
    With source maps, Sentry can show you the original code:
    ```
    Error at handleClick (src/app/page.tsx:45:12)
    ```
    This makes debugging production errors much easier!

### Key Concepts

- **Client vs Server Config:** Next.js runs code on both client and server. Separate configs handle each context.
- **Source Maps:** Map minified production code back to original source. Essential for debugging production errors.
- **Session Replay:** Records user sessions for debugging. Be mindful of privacy - use masking options.
- **ignoreErrors:** Filter out noise from browser extensions and common false positives.
- **User Feedback Dialog:** Allow users to provide context when errors occur.

---

## Task 4: Custom Breadcrumbs and Context

### Overview
Implement custom breadcrumbs to track user actions and add contextual information that helps debug errors. Breadcrumbs create a trail of events leading up to an error.

### Step-by-Step Instructions

1. **Add custom breadcrumbs to the frontend:**
   
   Update `polarh10-frontend/src/hooks/useHeartRate.ts` to add breadcrumbs:
   
   ```typescript
   'use client';
   
   import { useState, useEffect, useCallback, useRef } from 'react';
   import * as Sentry from '@sentry/nextjs';
   import {
     getLatestReading,
     getHeartRateStats,
     getHeartRateReadings,
     HeartRateReading,
     HeartRateStats,
   } from '@/lib/api';
   
   // ... existing interfaces ...
   
   export function useHeartRate(options: UseHeartRateOptions = {}): UseHeartRateResult {
     const { refreshInterval = 1000, historyMinutes = 5, enabled = true } = options;
     
     // ... existing state ...
   
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
         // Add breadcrumb for failed fetch
         Sentry.addBreadcrumb({
           category: 'data',
           message: 'Heart rate data fetch failed',
           level: 'error',
           data: {
             error: err instanceof Error ? err.message : 'Unknown error',
           },
         });
         
         const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
         setError(errorMessage);
         
         if (Date.now() - lastSuccessfulFetchRef.current > 5000) {
           setIsConnected(false);
         }
       } finally {
         setIsLoading(false);
       }
     }, [refreshInterval]);
   
     // ... rest of the hook ...
   }
   ```

2. **Add user context in the frontend:**
   
   Update `polarh10-frontend/src/app/page.tsx` to set user context:
   
   ```tsx
   'use client';
   
   import { useState, useEffect } from 'react';
   import * as Sentry from '@sentry/nextjs';
   // ... other imports ...
   
   export default function Dashboard() {
     const [historyMinutes, setHistoryMinutes] = useState(5);
     // ... other state ...
     
     // Set Sentry context on mount
     useEffect(() => {
       // Set user context (use actual user data if available)
       Sentry.setUser({
         id: 'anonymous',  // Replace with actual user ID if authenticated
         // email: user.email,
         // username: user.name,
       });
       
       // Set tags for filtering
       Sentry.setTag('app.view', 'dashboard');
       Sentry.setTag('app.historyMinutes', historyMinutes.toString());
       
       return () => {
         // Clear user on unmount (if needed)
         Sentry.setUser(null);
       };
     }, []);
     
     // Update tag when historyMinutes changes
     useEffect(() => {
       Sentry.setTag('app.historyMinutes', historyMinutes.toString());
       
       // Add breadcrumb for time range change
       Sentry.addBreadcrumb({
         category: 'ui.click',
         message: `Changed time range to ${historyMinutes} minutes`,
         level: 'info',
       });
     }, [historyMinutes]);
     
    // ... rest of component ...
    }
   ```

3. **Verify frontend breadcrumbs and user context in Sentry:**
   
   After implementing the above changes, test and verify they appear in Sentry:
   
   a. **Trigger a test error:**
      - Open your app at `http://localhost:3000`
      - Change the time range buttons a few times (this creates breadcrumbs)
      - Click the "Test Sentry" button to trigger an error
   
   b. **View the error in Sentry Dashboard:**
      - Go to **Issues** in your Sentry dashboard
      - Click on the "Test Sentry Error from Frontend" issue
   
   c. **Check the Breadcrumbs section:**
      - Scroll down to the **Breadcrumbs** panel
      - You should see entries like:
        ```
        ui.click    Changed time range to 5 minutes     info
        ui.click    Changed time range to 15 minutes    info
        ui.click    Changed time range to 30 minutes    info
        ```
      - You'll also see automatic breadcrumbs from Sentry (console logs, fetch requests, etc.)
   
   d. **Check User context:**
      - Look at the **User** section in the error details
      - You should see: `id: anonymous`
   
   e. **Check Tags:**
      - Look at the **Tags** section
      - You should see:
        - `app.view: dashboard`
        - `app.historyMinutes: 15` (or whatever value was set)
      - These tags are searchable! You can filter issues by `app.view:dashboard` in the search bar

   **Tip:** Tags are great for filtering issues in Sentry. For example, search `app.historyMinutes:30` to find all errors that occurred when users had the 30-minute view selected.

4. **Add breadcrumbs to the backend:**
   
   Update `polarh10-backend/heartrate/views.py`:
   
   ```python
   """
   API views for HeartRate app with Sentry breadcrumbs.
   """
   
   import sentry_sdk
   from datetime import timedelta
   from django.utils import timezone
   from django.db.models import Avg, Min, Max, Count
   from rest_framework import viewsets, status
   from rest_framework.decorators import action
   from rest_framework.response import Response
   
   from .models import HeartRateReading
   from .serializers import HeartRateReadingSerializer, HeartRateStatsSerializer
   
   
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
           queryset = HeartRateReading.objects.all()
           
           minutes = self.request.query_params.get('minutes')
           if minutes:
               try:
                   minutes = int(minutes)
                   cutoff_time = timezone.now() - timedelta(minutes=minutes)
                   queryset = queryset.filter(created_at__gte=cutoff_time)
                   
                   # Add breadcrumb for filtering
                   sentry_sdk.add_breadcrumb(
                       category='query',
                       message=f'Filtered readings to last {minutes} minutes',
                       level='info',
                       data={'minutes': minutes, 'cutoff': str(cutoff_time)}
                   )
               except ValueError:
                   sentry_sdk.add_breadcrumb(
                       category='query',
                       message='Invalid minutes parameter',
                       level='warning',
                       data={'minutes_raw': minutes}
                   )
           
           return queryset.order_by('-created_at')
   
       @action(detail=False, methods=['get'])
       def stats(self, request):
           """
           Get aggregated statistics for heart rate readings.
           """
           # Add breadcrumb for stats calculation
           sentry_sdk.add_breadcrumb(
               category='api',
               message='Calculating heart rate statistics',
               level='info'
           )
           
           # Set additional context
           sentry_sdk.set_context('request_params', {
               'minutes': request.query_params.get('minutes'),
               'user_agent': request.META.get('HTTP_USER_AGENT', 'unknown')[:100],
           })
           
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
           
           # Add breadcrumb with results
           sentry_sdk.add_breadcrumb(
               category='api',
               message='Statistics calculated successfully',
               level='info',
               data={
                   'count': stats['count'],
                   'avg_bpm': stats['avg_bpm'],
               }
           )
           
           if stats['avg_bpm']:
               stats['avg_bpm'] = round(stats['avg_bpm'], 1)
           if stats['avg_rr_interval']:
               stats['avg_rr_interval'] = round(stats['avg_rr_interval'], 1)
           
           serializer = HeartRateStatsSerializer(stats)
           return Response(serializer.data)
   
       # ... rest of the viewset ...
   ```

4. **Test breadcrumbs by triggering an error:**
   
   Add a test endpoint that generates an error after breadcrumbs:
   
   In `polarh10-backend/heartrate/views.py`, add to the viewset:
   
   ```python
   @action(detail=False, methods=['get'])
   def breadcrumb_test(self, request):
       """
       Test endpoint to verify breadcrumbs are captured.
       DELETE THIS IN PRODUCTION.
       """
       # Add several breadcrumbs
       sentry_sdk.add_breadcrumb(
           category='test',
           message='Step 1: User opened dashboard',
           level='info'
       )
       
       sentry_sdk.add_breadcrumb(
           category='test',
           message='Step 2: User changed time range',
           level='info',
           data={'from': 5, 'to': 15}
       )
       
       sentry_sdk.add_breadcrumb(
           category='test',
           message='Step 3: Data fetch initiated',
           level='info'
       )
       
       # Now trigger an error - breadcrumbs will be attached
       raise ValueError("Test error with breadcrumbs")
   ```

5. **Test and verify breadcrumbs:**
   
   Restart the backend and trigger the test:
   ```bash
   curl http://localhost:8000/api/heartrate/breadcrumb_test/
   ```
   
   In Sentry, open the error and look for the **Breadcrumbs** section. You should see:
   - The custom breadcrumbs you added
   - Automatic HTTP breadcrumbs from Django
   - SQL query breadcrumbs (if any queries were made)

6. **Remove test endpoints:**
   
   Remember to remove `sentry_test` and `breadcrumb_test` endpoints before deploying to production!

### Key Concepts

- **Breadcrumbs:** Trail of events leading up to an error. Automatically collected for HTTP requests, console logs, and DOM events.
- **Custom Breadcrumbs:** Add domain-specific events (user actions, state changes) for better debugging.
- **Context:** Additional data attached to events. Use `setContext` for structured data, `setTag` for filterable values.
- **User Context:** Associate errors with users for support and debugging. Be mindful of PII.
- **Categories:** Organize breadcrumbs by type (ui.click, data, api, query) for easier filtering.

---

## Task 5: Alert Configuration

### Overview
Configure Sentry alerts to notify your team when critical errors occur. You'll set up issue alerts based on error conditions and metric alerts for monitoring thresholds.

### Step-by-Step Instructions

1. **Access Alert Settings:**
   
   In Sentry, navigate to **Alerts** → **Create Alert**

2. **Create an Issue Alert for new errors:**
   
   - Click "Create Alert"
   - Select **Issues** as the alert type
   - Select "production" environment (or "development" for testing)
   - Select your project (either backend or frontend)
   
   Configure the alert:
   - **When:** "A new issue is created" (see all other possibilities)
   - **Filter:** 
     - The event's level is "greater than or equal to" "error"
   - **Then:** Perform these actions:
     - Send a notification to "Suggested Assignees"
     - All Project Members
   - **Set action interval:** 24 hours
   - **Name:** "New Error Alert - Backend"
   
   Click "Create Alert"

3. **Create a threshold alert for error spikes:**
   
   - Create another alert
   - Select **Number of Errors** as the metric
   
   Configure:
   - "Number of Errors" in "1 hour interval"
   - "frontend" "production"
   - "Static: above or below (x)"
   - Set levels
   
   This alerts you when there's a sudden increase in errors.

4. **Test your alerts:**
   
   Trigger test errors from both backend and frontend:
   ```bash
   # Backend
   curl http://localhost:8000/api/heartrate/sentry_test/
   
   # Frontend - click the test button
   ```
   
   Verify you receive notifications based on your alert rules.

### Key Concepts

- **Issue Alerts:** Trigger based on issue state (new, regressed, resolved). Good for catching new bugs.
- **Metric Alerts:** Trigger based on thresholds (error count, rate, performance). Good for detecting anomalies.
- **Alert Fatigue:** Too many alerts leads to ignoring them. Be selective about what triggers notifications.
- **Routing:** Different alerts can go to different teams or channels based on tags/projects.
- **Integrations:** Sentry integrates with Slack, Teams, PagerDuty, Jira, and many other tools.

---

## Best Practices

1. **Use separate DSNs for frontend and backend** — Different projects allow for application-specific configuration and cleaner issue tracking

2. **Configure sampling rates appropriately** — Use 100% in development, 10-25% in production for high-traffic applications

3. **Implement release tracking** — Always tag errors with release versions for tracking regressions

4. **Use environment tags** — Separate development, staging, and production errors

5. **Add meaningful breadcrumbs** — Track user actions and state changes leading up to errors

6. **Configure alerts thoughtfully** — Avoid alert fatigue by focusing on actionable alerts

7. **Upload source maps** — Essential for debugging minified production JavaScript

8. **Set user context when available** — Helps correlate errors with user reports

9. **Filter noise** — Use `ignoreErrors` to filter browser extension errors and other false positives

10. **Review errors regularly** — Don't just collect errors - schedule time to review and fix them

---

END LAB
