# Debugging Next.js Frontend Workshop

## Workshop Overview

In this practical workshop, you will learn essential frontend debugging techniques for Next.js applications using the Polar H10 Heart Rate Dashboard. You'll work with browser developer tools, React DevTools, and implement error boundaries while gaining hands-on experience with performance and network inspection.

### Learning Objectives

By the end of this workshop, you will be able to:
- Navigate and effectively use browser developer tools (Chrome/Firefox/Edge)
- Understand and utilize source maps for debugging transpiled code
- Install and use React DevTools to inspect component trees and state
- Monitor and debug network requests between frontend and backend
- Use console methods effectively for debugging (log, table, trace, group)
- Inspect and manipulate the DOM in real-time
- Identify rendering bottlenecks
- Implement React Error Boundaries for graceful error handling

---

## Task 1: Browser Developer Tools and Console Debugging

### Overview
Learn to navigate browser developer tools and use advanced console methods for effective debugging. You'll explore the Elements, Console, and Sources panels while debugging the Heart Rate Dashboard application.

### Step-by-Step Instructions

1. **Start the backend server:**
   
   Open a terminal and navigate to the backend directory:
   ```bash
   cd polarh10-backend
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   python manage.py runserver
   ```

2. **Start the Next.js development server:**
   
   Open another terminal:
   ```bash
   cd polarh10-frontend
   npm run dev
   ```
   
   Open your browser and navigate to `http://localhost:3000`.

3. **Open Developer Tools:**
   
   Use one of these methods:
   - **Chrome/Edge:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (macOS)
   - **Firefox:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (macOS)
   - **Right-click** on the page → "Inspect" or "Inspect Element"

4. **Explore the Console panel:**
   
   Click on the **Console** tab. This is where JavaScript logs and errors appear.
   
   Try these console commands directly in the Console:
   ```javascript
   // You may need to type
   allow pasting

   // Basic logging
   console.log('Hello from DevTools!');
   
   // Log with styling
   console.log('%cStyled message', 'color: #ff3366; font-size: 20px; font-weight: bold');
   
   // Log objects as tables
   const readings = [{bpm: 72, time: '10:00'}, {bpm: 85, time: '10:01'}, {bpm: 78, time: '10:02'}];
   console.log(readings);
   console.table(readings);
   
   // Group related logs (paste all together)
   console.group('Heart Rate Data');
   console.log('Average: 78 BPM');
   console.log('Max: 85 BPM');
   console.groupEnd();
   
   // Trace function calls
   console.trace('Where was this called from?');

   // Clear console
   clear();
   ```

5. **Add debugging logs to the application:**
   
   Open `polarh10-frontend/src/hooks/useHeartRate.ts` and add console statements:
   
   ```typescript
   const fetchData = useCallback(async () => {
     console.group('📊 Heart Rate Fetch');
     console.time('fetchData');
     
     try {
       const [latestData, statsData, historyData] = await Promise.all([
         getLatestReading().catch(() => null),
         getHeartRateStats(historyMinutesRef.current),
         getHeartRateReadings(historyMinutesRef.current),
       ]);
 
       console.log('Latest reading:', latestData);
       console.table(statsData);
       console.log('History count:', historyData.results?.length || 0);
       
       if (latestData) {
         setLatestReading(latestData);
       }
       setStats(statsData);
       setHistory(historyData.results || []);
       setError(null);
       setIsConnected(true);
       lastSuccessfulFetchRef.current = Date.now();
     } catch (err) {
       console.error('Fetch error:', err);
       const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
       setError(errorMessage);
       
       if (Date.now() - lastSuccessfulFetchRef.current > 5000) {
         setIsConnected(false);
       }
     } finally {
       console.timeEnd('fetchData');
       console.groupEnd();
       setIsLoading(false);
     }
   }, []);
   ```

6. **View the Console output:**
   
   Refresh the page (`F5` or `Ctrl+R`) and watch the Console. You should see:
   - Grouped logs for each fetch cycle
   - Timing information for API calls
   - Tabular display of stats data

7. **Filter console messages:**
   
   Notice the filter options at the top of the Console:
   - **All** - shows everything
   - **Errors** - only errors (red)
   - **Warnings** - only warnings (yellow)
   - **Info** - informational messages
   - **Verbose** - debug-level messages
   
   You can also use the text filter to search for specific messages (e.g., type "fetch" to filter).

8. **Preserve logs across page reloads:**
   
   Check the **"Preserve log"** checkbox in Console settings. This keeps logs even when navigating or refreshing. (This option might be useful when page is automatically redirecting)

9. **Clean up:**

    Remove all logs before next tasks.

### Key Concepts

- **Console Panel:** Primary debugging interface for viewing logs, errors, and running JavaScript
- **console.group/groupEnd:** Organize related logs into collapsible groups
- **console.table:** Display arrays/objects in a sortable table format
- **console.time/timeEnd:** Measure execution time between two points
- **console.trace:** Show the call stack leading to the current point
- **Log Filtering:** Filter by level (error, warn, info) or text search

---

## Task 2: Source Maps and JavaScript Debugging

### Overview
Understand how source maps work in Next.js and learn to debug original TypeScript/JSX code instead of transpiled JavaScript. You'll set breakpoints, step through code, and inspect variables.

### Step-by-Step Instructions

1. **Open the Sources panel:**
   
   In Developer Tools, click on the **Sources** tab (Chrome/Edge) or **Debugger** tab (Firefox).

2. **Understand the file structure:**
   
   In the left sidebar, you'll see several origins:
   - `localhost:3000` - Your Next.js application
   - `file://` or `webpack://` - Source-mapped files
   
   Navigate to: `file://./src/hooks/useHeartRate.ts`
   
   You should see your **original TypeScript code**, not the compiled JavaScript. This is source maps in action!

3. **Set a breakpoint:**
   
   In `useHeartRate.ts`, find the line inside `fetchData`:
   ```typescript
   const [latestData, statsData, historyData] = await Promise.all([
   ```
   
   Click on the line number in the left margin. A blue marker appears, indicating a breakpoint.

4. **Trigger the breakpoint:**
   
   Refresh the page. The debugger should pause at your breakpoint.
   
   When paused, observe the panels:
   - **Scope:** Shows local and closure variables
   - **Call Stack:** Shows the function call chain
   - **Breakpoints:** Lists all your breakpoints
   - **Watch:** Custom expressions to monitor

5. **Use stepping controls:**
   
   At the top of the debugger, find the control buttons:
   
   | Button | Action | Shortcut |
   |--------|--------|----------|
   | ▶️ Resume | Continue execution | F8 |
   | ⏭️ Step Over | Execute current line, skip functions | F10 |
   | ⬇️ Step Into | Enter function calls | F11 |
   | ⬆️ Step Out | Complete current function | Shift+F11 |
   
   Press **F10 (Step Over)** to execute the `Promise.all()` call and move to the next line.

6. **Inspect variables:**
   
   After stepping over the Promise.all, hover over `latestData` in the code. A tooltip shows its value.
   
   In the **Scope** panel, expand `Block` to see:
   - `latestData` - the latest reading object
   - `statsData` - statistics object
   - `historyData` - paginated readings

7. **Add a Watch expression:**
   
   In the **Watch** panel, click **"+"** and add:
   ```javascript
   statsData?.avg_bpm
   ```
   
   This expression will be evaluated whenever the debugger pauses.

8. **Set a conditional breakpoint:**
   
   Remove your current breakpoint (click on it).
   
   Right-click on the line `if (latestData) {` and select **"Add conditional breakpoint..."**
   
   Enter the condition:
   ```javascript
   latestData && latestData.bpm > 100
   ```
   
   The breakpoint will only pause when the BPM is above 100.

9. **Debug in VSCode:**
   
   You can also debug Next.js directly in VSCode. Create `.vscode/launch.json`:
   
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Next.js: debug - connects to already running session",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:3000",
         "webRoot": "${workspaceFolder}/polarh10-frontend"
       },
       {
         "name": "Next.js: debug - starts new Next.js session",
         "type": "node-terminal",
         "request": "launch",
         "command": "npm run dev",
         "cwd": "${workspaceFolder}/polarh10-frontend",
         "serverReadyAction": {
           "pattern": "- Local:.+(https?://.+)",
           "uriFormat": "%s",
           "action": "debugWithChrome"
         }
       }
     ]
   }
   ```

### Key Concepts

- **Source Maps:** Map compiled/minified code back to original source for debugging
- **Breakpoint:** Pause execution at a specific line of code
- **Conditional Breakpoint:** Pause only when a condition is true
- **Step Over/Into/Out:** Control execution flow during debugging
- **Scope Panel:** View variables in the current execution context
- **Watch Expressions:** Monitor specific values across debugging sessions

---

## Task 3: React DevTools and Component Inspection

### Overview
Install and use React DevTools to inspect the component tree, examine props and state, and profile component renders in the Heart Rate Dashboard.

### Step-by-Step Instructions

1. **Install React DevTools:**
   
   Install the browser extension:
   - **Chrome:** [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - **Firefox:** [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   
   After installing, refresh the page. You should see two new tabs in DevTools: **⚛️ Components**.

2. **Explore the Components panel:**
   
   Click on **⚛️ Components** tab.
   
   You'll see the React component tree:
   ```
   Dashboard
   ├── ConnectionStatus
   ├── StatsCard (×4)
   ├── HeartRateChart
   ├── LatestReading
   └── ReadingsTable
   ```
   
   Click on any component to inspect it.

3. **Inspect component props and hooks:**
   
   Click on **HeartRateChart** in the tree.
   
   In the right panel, you'll see:
   - **props:** `data`, `avgBpm` passed from the parent
   - **hooks:** `useMemo` results and their values
   
   Observe how `data` contains the array of heart rate readings.

4. **Inspect the Dashboard component:**
   
   Click on **Dashboard** (the root component).
   
   Observe the hooks section:
   - If you see `State` without hook's name try clicking wand 🪄 icon to automatically parse hook's name
   - Custom hook data from `useHeartRate`
   
   Try changing the `historyMinutes` state:
   - Double-click on the value (e.g., `5`)
   - Change it to `15`
   - Watch the UI update immediately!

5. **Search for components:**
   
   Use the search box at the top to find components by name:
   - Type "Stats" to highlight all `StatsCard` components
   - Type "Latest" to find the `LatestReading` component

6. **Highlight updates:**
   
   In the Components panel settings (⚙️ gear icon), enable:
   - **"Highlight updates when components render"**
   
   Now interact with the time range buttons on the page. Watch components flash when they re-render.
   
   Click different time ranges (1 min, 5 min, 15 min, 30 min) and observe:
   - Which components re-render
   - How often renders occur

7. **Inspect component source:**
   
   With a component selected (e.g., `LatestReading`), click the **`<>`** button in the right panel.
   
   This opens the component's source code in the Sources panel.

8. **Log component to console:**
   
   With a component selected, click the **bug icon** 🐛 or right-click → "Log this component to console."
   
   Switch to the Console tab to see the component's full data, including:
   - Props
   - Hooks data
   - Fiber information

9. **Edit props in real-time:**
   
   Select the **LatestReading** component.
   
   In the props section, find `isConnected` and toggle its value.
   
   Watch the UI change to show "Disconnected" or "Live" status.


### Key Concepts

- **React DevTools:** Browser extension for inspecting React applications
- **Component Tree:** Hierarchical view of all React components on the page
- **Props Inspection:** View data passed from parent to child components
- **Hooks Inspection:** View state, refs, and other hook values
- **Real-time Editing:** Modify props/state directly in DevTools to test changes
- **Render Highlighting:** Visual feedback showing which components re-render

---

## Task 4: Network Inspection and API Debugging

### Overview
Use the Network panel to monitor, inspect, and debug API calls between the Next.js frontend and Django backend. Learn to analyze request/response data and troubleshoot connection issues.

### Step-by-Step Instructions

1. **Open the Network panel:**
   
   In Developer Tools, click on the **Network** tab.
   
   If the panel is empty, refresh the page to capture requests.

2. **Observe network activity:**
   
   You'll see a list of all network requests:
   - HTML documents
   - JavaScript bundles
   - CSS files
   - API calls (XHR/Fetch)
   - WebSocket connections (if any)
   
   The heart rate dashboard makes periodic API calls to fetch data.

3. **Filter by request type:**
   
   Use the filter buttons at the top:
   - **All** - every request
   - **Fetch/XHR** - API calls only ← Click this
   - **JS** - JavaScript files
   - **CSS** - Stylesheets
   - **Img** - Images
   - **WS** - WebSockets
   
   With "Fetch/XHR" selected, you'll see only the API calls to the backend.

4. **Inspect an API request:**
   
   Click on a request to `localhost:8000/api/heartrate/stats/`
   
   Examine the tabs:
   - **Headers:** Request method, URL, status code, headers
   - **Payload:** Request body (for POST/PUT requests)
   - **Preview:** Formatted response (JSON as a tree)
   - **Response:** Raw response text
   - **Timing:** Detailed timing breakdown

5. **Analyze the Headers:**
   
   In the Headers tab, observe:
   
   **General:**
   - Request URL: `http://localhost:8000/api/heartrate/stats/?minutes=5`
   - Request Method: `GET`
   - Status Code: `200 OK`
   
   **Response Headers:**
   - `Content-Type: application/json`
   - `Access-Control-Allow-Origin` (CORS headers)
   
   **Request Headers:**
   - `Accept: application/json`
   - `Origin: http://localhost:3000`

6. **Examine the Response:**
   
   Click the **Preview** tab to see the JSON response formatted as a tree:
   ```json
   {
     "count": 150,
     "avg_bpm": 72.5,
     "min_bpm": 58,
     "max_bpm": 95,
     "avg_rr_interval": 832.4
   }
   ```
   
   Click on the **Response** tab to see the raw JSON string.

7. **Analyze request timing:**
   
   Click the **Timing** tab to see a waterfall breakdown:
   
   | Phase | Description |
   |-------|-------------|
   | Queueing | Time waiting in browser queue |
   | Stalled | Time waiting for connection |
   | Request sent | Time to send request |
   | Waiting for server response | (TTFB) Time to first byte from server |
   | Content Download | Time to receive response body |
   
   For local development, "Waiting (TTFB)" shows server processing time.

8. **Simulate network conditions:**
   
   Click the **"No throttling"** dropdown in the Network panel.
   
   Select different presets:
   - **Fast 3G** - 150ms latency, limited bandwidth
   - **Slow 3G** - 400ms latency, very limited bandwidth
   - **Offline** - No network connection
   
   With "Slow 3G" selected, refresh the page and observe:
   - Longer request times
   - How the app handles slow connections
   
   Reset to "No throttling" when done.

9. **Test API failure handling:**
   
   Stop the backend server (`Ctrl+C` in the terminal running Django).
   
   Observe the Network panel:
   - Requests show red (failed)
   - Error: `ERR_CONNECTION_REFUSED` or `Failed to fetch`
   
   Check the Console for error messages.
   
   Observe the UI:
   - Connection status should show "Disconnected"
   - Error message should appear
   
   Restart the backend server to continue.

10. **Copy requests for testing:**
    
    Right-click on any API request and select:
    - **Copy → Copy as cURL** - generates a curl command
    - **Copy → Copy as fetch** - generates JavaScript fetch code
    - **Copy → Copy as Powershell** - generates a Powershell command
    
    Paste the curl command in a terminal to replay the request:
    ```bash
    curl 'http://localhost:8000/api/heartrate/stats/?minutes=5' \
      -H 'Accept: application/json'
    ```

11. **Block requests to test error handling:**
    
    Right-click on an API request and select **"Block request URL"**.
    
    Refresh the page. That specific request will be blocked.
    
    Observe how the application handles the missing data.
    
    To unblock: Right-click → "Unblock request URL" or clear the block list in the Network panel drawer.

### Key Concepts

- **Network Panel:** Monitor all HTTP requests between browser and servers
- **Request/Response Inspection:** Examine headers, body, and timing
- **Filtering:** Focus on specific request types (XHR, JS, CSS)
- **Network Throttling:** Simulate slow network conditions
- **Request Blocking:** Test error handling by blocking specific requests
- **Copy as cURL:** Extract requests for command-line testing
- **Timing Waterfall:** Understand where time is spent in network requests

---

## Task 5: Error Boundaries and Error Handling

### Overview
Learn how React applications behave when components throw errors, and implement Error Boundaries to gracefully handle runtime errors. You'll first see the problem (entire page crashes), then implement the solution (isolated error handling).

### Step-by-Step Instructions

#### Part A: Observe the Problem - Errors Without Error Boundaries

1. **Force a component error using React DevTools:**
   
   Open the application in your browser and open React DevTools (⚛️ Components tab).
   
   In the component tree, select the **LatestReading** component.
   
   In the right panel, look for the **error icon** (⚠️) button. **"Force the selected component into an errored state"** feature.
   
   Click it.

2. **Observe what happens:**
   
   The **entire page crashes** and shows React's default error screen:
   - In development, you'll see a red error overlay with the error message
   - The whole dashboard becomes unusable
   
   This is the default behavior without Error Boundaries - **one broken component breaks the entire application**.

3. Without Error Boundaries:
   - Any JavaScript error in a component's render method crashes the entire React tree
   - Users lose all functionality, not just the broken feature

#### Part B: Implement Error Boundaries

4. **Create an Error Boundary component:**
   
   Create a new file `polarh10-frontend/src/components/ErrorBoundary.tsx`:
   
   ```tsx
   'use client';
   
   import { Component, ReactNode } from 'react';
   
   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
     onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
   }
   
   interface State {
     hasError: boolean;
     error: Error | null;
   }
   
   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false, error: null };
     }
   
     static getDerivedStateFromError(error: Error): State {
       // Update state so the next render shows the fallback UI
       return { hasError: true, error };
     }
   
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
       // Log the error to console (in production, send to error tracking service)
       console.group('🚨 Error Boundary Caught Error');
       console.error('Error:', error);
       console.error('Component Stack:', errorInfo.componentStack);
       console.groupEnd();
       
       // Call optional error handler
       this.props.onError?.(error, errorInfo);
     }
   
     handleRetry = (): void => {
       this.setState({ hasError: false, error: null });
     };
   
     render(): ReactNode {
       if (this.state.hasError) {
         // Custom fallback UI if provided
         if (this.props.fallback) {
           return this.props.fallback;
         }
         
         // Default fallback UI
         return (
           <div className="flex flex-col items-center justify-center p-8 bg-[var(--background-card)] rounded-2xl border border-[var(--danger)]/30">
             <div className="text-5xl mb-4">⚠️</div>
             <h2 className="text-xl font-semibold text-[var(--danger)] mb-2">
               Something went wrong
             </h2>
             <p className="text-[var(--foreground-muted)] text-center mb-4 max-w-md">
               {this.state.error?.message || 'An unexpected error occurred'}
             </p>
             <button
               onClick={this.handleRetry}
               className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
             >
               Try Again
             </button>
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

5. **Create a specialized Chart Error Boundary:**
   
   Create `polarh10-frontend/src/components/ChartErrorBoundary.tsx`:
   
   ```tsx
   'use client';
   
   import { Component, ReactNode } from 'react';
   
   interface Props {
     children: ReactNode;
   }
   
   interface State {
     hasError: boolean;
   }
   
   export class ChartErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(): State {
       return { hasError: true };
     }
   
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
       console.error('Chart rendering error:', error, errorInfo);
     }
   
     render(): ReactNode {
       if (this.state.hasError) {
         return (
           <div className="flex items-center justify-center h-full">
             <div className="text-center">
               <div className="text-6xl mb-4">📉</div>
               <p className="text-[var(--foreground-muted)]">
                 Unable to render chart
               </p>
               <button
                 onClick={() => this.setState({ hasError: false })}
                 className="mt-4 px-3 py-1.5 text-sm bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--foreground-muted)] transition-colors"
               >
                 Retry
               </button>
             </div>
           </div>
         );
       }
   
       return this.props.children;
     }
   }
   ```

6. **Export the Error Boundaries:**
   
   Update `polarh10-frontend/src/components/index.ts`:
   
   ```typescript
   export { HeartRateChart } from './HeartRateChart';
   export { StatsCard } from './StatsCard';
   export { LatestReading } from './LatestReading';
   export { ConnectionStatus } from './ConnectionStatus';
   export { ReadingsTable } from './ReadingsTable';
   export { ErrorBoundary } from './ErrorBoundary';
   export { ChartErrorBoundary } from './ChartErrorBoundary';
   ```

7. **Wrap components with Error Boundaries:**
   
   Update `polarh10-frontend/src/app/page.tsx` to use Error Boundaries.
   
   Add imports:
   ```tsx
   import {
     HeartRateChart,
     StatsCard,
     LatestReading,
     ConnectionStatus,
     ReadingsTable,
     ErrorBoundary,
     ChartErrorBoundary,
   } from '@/components';
   ```
   
   Wrap components in the return statement:
   
   ```tsx
   {/* Wrap the chart with ChartErrorBoundary */}
   <div className="h-[300px]">
     <ChartErrorBoundary>
       <HeartRateChart data={history} avgBpm={stats?.avg_bpm} />
     </ChartErrorBoundary>
   </div>
   
   {/* Wrap LatestReading with ErrorBoundary */}
   <div className="lg:col-span-1">
     <ErrorBoundary>
       <LatestReading reading={latestReading} isConnected={isConnected} />
     </ErrorBoundary>
   </div>
   ```

#### Part C: Test the Improvement

8. **Force errors again with Error Boundaries in place:**
   
   Refresh the page to load the updated code.
   
   Open React DevTools → Components tab.
   
   Navigate to: **ErrorBoundary** → **LatestReading**
   
   Select **LatestReading** and click the **error icon** (⚠️) to force an error.

9. **Observe the difference:**
    
    Now you should see:
    - **Only the LatestReading section shows an error** with our custom fallback UI
    - The **rest of the page remains fully functional**
    

10. **Test the Chart Error Boundary:**
    
    Refresh the page.
    
    Navigate to: **ChartErrorBoundary** → **HeartRateChart**
    
    Select **HeartRateChart** and force an error.
    
    Observe:
    - Only the chart area shows "Unable to render chart" 📉
    - The latest reading, stats cards, and table all work normally
    
11. **View errors in the Console:**
    
    When an error is caught, check the Console:
    - You'll see our grouped error log: "🚨 Error Boundary Caught Error"
    - The error message and component stack trace are displayed
    - This is from our `componentDidCatch` method


### Key Concepts

- **Error Boundary:** React component that catches JavaScript errors in child components
- **getDerivedStateFromError:** Static method to update state when error occurs
- **componentDidCatch:** Lifecycle method to log errors and send to tracking services
- **Fallback UI:** Alternative content shown when an error occurs
- **Error Isolation:** Wrap sections independently so errors don't crash the entire app
- **Error Recovery:** Provide "retry" functionality to reset error state
- **React DevTools Error Testing:** Use "Force the selected component into an errored state" to test error handling

---

## Best Practices

1. **Remove console statements before production** — Use a linter rule or build process to strip them
2. **Use Error Boundaries strategically** — Wrap major UI sections, not every component
3. **Log structured data** — Use console.table and console.group for complex data
4. **Monitor network requests** — Watch for failed requests and slow responses
5. **Profile before optimizing** — Use the Profiler to identify actual bottlenecks
6. **Test error scenarios** — Simulate network failures and component errors during development
7. **Use source maps in development** — Disable in production for security

---

END LAB
