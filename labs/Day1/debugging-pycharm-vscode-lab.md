# Debugging in PyCharm/VSCode Workshop

## Workshop Overview

In this practical workshop, you will learn essential debugging techniques using PyCharm and Visual Studio Code. You'll work with a real Django REST API application (PolarH10 Heart Rate Backend) and gain hands-on experience with breakpoints, variable inspection, stack trace analysis, and advanced debugging features.

### Learning Objectives

By the end of this workshop, you will be able to:
- Set up and configure debugging environments in PyCharm and VSCode
- Use breakpoints effectively to pause code execution
- Inspect variables and evaluate expressions during debugging
- Analyze stack traces to understand code execution flow
- Use step execution commands (step into, step over, step out)
- Create watch expressions to monitor specific values
- Configure conditional breakpoints for targeted debugging
- Set up remote debugging for containerized applications

---

## Task 1: Set Up the Debugging Environment

### Overview
Configure your IDE for debugging the Django application. You'll create the necessary launch configurations and verify the debugger is working correctly.

### Step-by-Step Instructions

#### For Visual Studio Code:

1. **Ensure project is opened in the main repository directory (e.g., szkolenie-15_01_2025), and navigate in terminal to polarh10-backend directory:**
   ```bash
   cd polarh10-backend
   ```

2. **Install the Python extension:**
   - Open the Extensions panel (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Python" by Microsoft
   - Install the extension if not already installed

3. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

4. **Verify the Python interpreter:**
   
   Ensure VS Code is using the correct Python interpreter from your virtual environment:
   - Check the bottom status bar - it should show `Python 3.x.x ('venv': venv)`
   - If not, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS), type "Python: Select Interpreter", and select the interpreter from your venv
   
5. **Create a debug configuration:**
   - Click on the Run and Debug icon in the sidebar (Ctrl+Shift+D / Cmd+Shift+D)
   - Click "create a launch.json file"
   - Select "Python Debugger" → "Django" → select `manage.py` file 
   - VSCode will create a `.vscode/launch.json` file

6. **Modify the launch.json for our project:**
   
   Open `.vscode/launch.json` and update it:
   
   ```json
   {
       "version": "0.2.0",
       "configurations": [
           {
               "name": "Python Debugger: Django",
               "type": "debugpy",
               "request": "launch",
               "args": ["runserver", "0.0.0.0:8000", "--noreload"],
               "django": true,
               "justMyCode": false,
               "program": "${workspaceFolder}\\polarh10-backend\\manage.py",
               "cwd": "${workspaceFolder}\\polarh10-backend",
               "env": {
                   "DJANGO_DEBUG": "True"
               }
           }
       ]
   }
   ```

   Key configuration options:
   - **program**: Path to Django's manage.py
   - **cwd**: Working directory for the debugger (where manage.py is located)
   - **args**: Command-line arguments (runserver with port)
   - **--noreload**: Prevents Django from restarting (important for debugging)
   - **justMyCode**: Set to `false` to debug into library code
   - **env**: Environment variables for the debug session

7. **Verify the setup:**
   - Press F5 or click the green play button
   - The Django development server should start
   - You should see output in the Debug Console
   - To stop the debugger, press **Shift+F5** or click the red square (Stop) button in the debug toolbar

8. **Run database migrations:**
   Before proceeding to the next tasks, initialize the database by running migrations:
   
   **In the integrated terminal (make sure venv is activated):**
   ```bash
   python polarh10-backend/manage.py migrate
   ```
   
   This creates the necessary database tables for the HeartRate app. You should see output like:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, heartrate, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     ...
   ```

#### For PyCharm:

1. **Open the project in PyCharm:**
   - File → Open → Select the main workshop folder (e.g., `szkolenie-15_01_2025`)
   - This keeps you in the main repository directory

2. **Verify the Python interpreter:**
   
   Ensure PyCharm is using the correct Python interpreter from your virtual environment:
   - Go to File → Settings → Project → Python Interpreter
   - Check that the interpreter path points to your venv (e.g., `polarh10-backend/venv/Scripts/python.exe`)
   - If not, click the gear icon → Add → Virtualenv Environment → Existing environment, and select the interpreter from your venv

3. **Install dependencies:**
   - Open Terminal in PyCharm (Alt+F12)
   ```bash
   cd polarh10-backend
   pip install -r requirements.txt
   ```

4. **Create a Django run configuration:**
   - Go to Run → Edit Configurations
   - Click "+" → Django Server
   - Configure:
     - Name: `Django Server`
     - Host: `0.0.0.0`
     - Port: `8000`
     - Working directory: `$PROJECT_DIR$/polarh10-backend`
     - Environment variables: Add any required env vars
   - Click OK

5. **Verify the setup:**
   - Click the Debug button (green bug icon) or press Shift+F9
   - The server should start in debug mode
   - To stop the debugger, press **Ctrl+F2** or click the red square (Stop) button in the debug toolbar

6. **Run database migrations:**
   Before proceeding to the next tasks, initialize the database by running migrations:
   
   **In the terminal (make sure venv is activated):**
   ```bash
   python polarh10-backend/manage.py migrate
   ```
   
   This creates the necessary database tables for the HeartRate app. You should see output like:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, heartrate, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     ...
   ```

### Key Concepts

- **Debug Configuration:** Defines how the debugger launches and connects to your application
- **justMyCode:** When disabled, allows stepping into library/framework code
- **--noreload:** Django's auto-reload feature conflicts with debuggers; disable it for debugging
- **Debug Console:** Shows debugger output and allows interactive expression evaluation

---

## Task 2: Working with Breakpoints and Variable Inspection

### Overview
Learn to set breakpoints to pause code execution and inspect variables to understand the application state at specific points.

### Step-by-Step Instructions

1. **Open the views.py file:**
   Navigate to `polarh10-backend/heartrate/views.py` in your IDE.

2. **Set a breakpoint on the `get_queryset` method:**
   - Find the `get_queryset` method in the `HeartRateViewSet` class (around line 31)
   - Click in the gutter (left margin) next to line 38: `queryset = HeartRateReading.objects.all()`
   - A red dot should appear indicating a breakpoint

   ```python
   def get_queryset(self):
       """
       Optionally filter readings by time range.
       """
       queryset = HeartRateReading.objects.all()  # ← Set breakpoint here
   ```

3. **Set another breakpoint in the `stats` action:**
   - Find the `stats` method (around line 68)
   - Set a breakpoint on line 87: `stats = queryset.aggregate(...)`

   ```python
   @action(detail=False, methods=['get'])
   def stats(self, request):
       """Get aggregated statistics..."""
       queryset = self.get_queryset()
       
       stats = queryset.aggregate(  # ← Set breakpoint here
           count=Count('id'),
           ...
       )
   ```

4. **Start the debugger:**
   - Press F5 (VSCode) or Shift+F9 (PyCharm)
   - Wait for the server to start

5. **Trigger the breakpoint:**
   - Open a browser or use curl to access the API:
   ```bash
   curl http://localhost:8000/api/heartrate/
   ```
   - The debugger should pause at your first breakpoint

6. **Inspect variables in VSCode:**
   - Look at the **Variables** panel on the left side:
     - **Locals**: Variables in the current scope
     - **Globals**: Global variables
   - Expand `self` to see the ViewSet instance
   - Expand `self.request` to see the HTTP request details

7. **Inspect variables in PyCharm:**
   - The **Variables** panel shows all variables in scope
   - Click the "+" icon to expand complex objects
   - Right-click a variable → "View as DataFrame" for data structures

8. **Use the Debug Console for evaluation:**
   
   **In VSCode:**
   - Open the Debug Console (Ctrl+Shift+Y)
   - Type expressions to evaluate:
   ```python
   self.request.method
   self.request.query_params
   HeartRateReading.objects.count()
   ```

   **In PyCharm:**
   - Click "Evaluate Expression" (Alt+F8)
   - Or use the "Console" tab in the Debug panel
   ```python
   self.request.method
   len(queryset)
   ```

9. **Inspect the queryset:**
   - In the Debug Console, evaluate:
   ```python
   list(queryset[:5])  # First 5 records
   queryset.query      # SQL query that will be executed
   ```

10. **Continue execution:**
    - Press **F5** in VSCode or **F9** in PyCharm (Continue) to resume execution until the next breakpoint
    - The debugger should now pause at the `stats` breakpoint if you access `/api/heartrate/stats/`

### Key Concepts

- **Breakpoint:** A marker that tells the debugger to pause execution at a specific line
- **Variables Panel:** Shows all variables in the current scope with their values
- **Debug Console:** Interactive Python console that runs in the context of the paused execution
- **Scope:** The context in which variables are accessible (local, global, closure)

---

## Task 3: Stack Trace Analysis and Navigation

### Overview
Learn to read and navigate stack traces to understand the execution flow and identify the source of errors.

### Step-by-Step Instructions

1. **Introduce a deliberate error:**
   Open `polarh10-backend/heartrate/views.py` and temporarily modify the `stats` method to cause an error:
   
   ```python
   @action(detail=False, methods=['get'])
   def stats(self, request):
       queryset = self.get_queryset()
       
       # Add this line to cause an error
       result = 1 / 0  # Division by zero error
       
       stats = queryset.aggregate(
           count=Count('id'),
           ...
       )
   ```

2. **Enable "Raised Exceptions" breakpoint:**
   
   **In VSCode:**
   - In the Run and Debug panel, find the "Breakpoints" section
   - Check "User Uncaught Exceptions"
   
   **In PyCharm:**
   - Go to Run → View Breakpoints (Ctrl+Shift+F8)
   - Check "Python Exception Breakpoint"
   - You can specify exception types (e.g., `ZeroDivisionError`)

3. **Trigger the error:**
   ```bash
   curl http://localhost:8000/api/heartrate/stats/
   ```
   The debugger will pause at the line causing the exception.

4. **Analyze the Call Stack:**
   
   **In VSCode:**
   - Look at the "Call Stack" panel
   - You'll see a list of function calls from bottom (entry point) to top (current location)
   - Example stack:
     ```
     stats (views.py:72)
     dispatch (viewsets.py:125)
     view (views.py:509)
     _get_response (base.py:197)
     ...
     ```
   
   **In PyCharm:**
   - The "Frames" panel shows the call stack
   - Each frame represents a function call

5. **Navigate through the stack:**
   - Click on different frames to see the code and variables at each level
   - This helps understand how the request flowed through Django to your code
   - Notice how clicking a frame changes:
     - The code view (shows the line in that function)
     - The variables panel (shows variables in that scope)

6. **Understand the stack trace:**
   ```
   Frame 1: stats() in views.py         ← Your code (where error occurred)
   Frame 2: dispatch() in viewsets.py   ← DRF ViewSet dispatch
   Frame 3: view() in views.py          ← DRF view wrapper
   Frame 4: _get_response() in base.py  ← Django request handling
   Frame 5: __call__() in wsgi.py       ← WSGI entry point
   ```
   
   Reading bottom-to-top shows how the request reached your code.

7. **Use "Jump to Source":**
   - Double-click a frame to open the source file at that location
   - This is useful for understanding framework behavior

8. **Remove the error:**
   Delete the `result = 1 / 0` line you added.

9. **Practice with a real scenario:**
   - Set a breakpoint in `get_queryset()`
   - Access `/api/heartrate/stats/`
   - Observe that `get_queryset()` is called from `stats()` method
   - Navigate the stack to see the relationship

### Key Concepts

- **Call Stack:** A list of active function calls, showing the path of execution
- **Stack Frame:** A single entry in the call stack, containing function context and local variables
- **Stack Trace:** A snapshot of the call stack at a specific moment (often when an error occurs)
- **Exception Breakpoint:** Automatically pauses when specific exceptions are raised
- **Frame Navigation:** Clicking frames lets you inspect variables at different levels of execution

---

## Task 4: Step Execution Commands

### Overview
Master the step execution commands to control code execution line by line and understand the difference between Step Into, Step Over, and Step Out.

### Step-by-Step Instructions

1. **Set a breakpoint at the beginning of the `stats` method:**
   ```python
   @action(detail=False, methods=['get'])
   def stats(self, request):
       queryset = self.get_queryset()  # ← Set breakpoint here
   ```

2. **Start debugging and trigger the breakpoint:**
   ```bash
   curl http://localhost:8000/api/heartrate/stats/
   ```

3. **Learn the Step Commands:**

   | Command | VSCode Shortcut | PyCharm Shortcut | Description |
   |---------|----------------|------------------|-------------|
   | Continue | F5 | F9 | Resume execution until next breakpoint |
   | Step Over | F10 | F8 | Execute current line, don't enter functions |
   | Step Into | F11 | F7 | Execute current line, enter function calls |
   | Step Out | Shift+F11 | Shift+F8 | Complete current function, return to caller |
   | Restart | Ctrl+Shift+F5 | Ctrl+F5 | Restart the debugging session |
   | Stop | Shift+F5 | Ctrl+F2 | Stop debugging |

4. **Practice Step Over (F10 / F8):**
   - With the debugger paused at `queryset = self.get_queryset()`
   - Press Step Over
   - The line executes completely, and you move to the next line
   - Notice: You didn't enter the `get_queryset()` method

5. **Restart and practice Step Into (F11 / F7):**
   - Stop the debugger and start again
   - When paused at `queryset = self.get_queryset()`
   - Press Step Into
   - You'll now be inside the `get_queryset()` method
   - Continue stepping to see how the queryset is built

6. **Practice Step Out (Shift+F11 / Shift+F8):**
   - While inside `get_queryset()`
   - Press Step Out
   - The rest of `get_queryset()` executes
   - You return to the `stats()` method, right after the call

7. **Combine stepping techniques:**
   - Use Step Over to skip over simple assignments
   - Use Step Into when you want to understand a function's behavior
   - Use Step Out when you've seen enough of a function

8. **Step through the aggregate query:**
   - Set a breakpoint on the `stats = queryset.aggregate(...)` line
   - Use Step Over to execute the entire aggregate call
   - Inspect the `stats` variable to see the results

9. **Step through conditional logic:**
   - Find the lines that check and round values:
   ```python
   if stats['avg_bpm']:
       stats['avg_bpm'] = round(stats['avg_bpm'], 1)
   ```
   - Step through to see which branches are taken
   - Observe how variable values change after each step

### Key Concepts

- **Step Over:** Executes the current line as a single unit, useful for skipping function calls
- **Step Into:** Enters function calls to debug their implementation
- **Step Out:** Completes the current function and returns to the caller
- **Execution Pointer:** The yellow arrow/highlight showing the next line to execute
- **Step Granularity:** Choose the right step command based on what you want to inspect

---

## Task 5: Watch Expressions and Conditional Breakpoints

### Overview
Use watch expressions to monitor specific values throughout debugging, and set conditional breakpoints to pause only when certain conditions are met.

### Step-by-Step Instructions

#### Part A: Watch Expressions

1. **Open the Watch panel:**
   
   **In VSCode:**
   - In the Run and Debug sidebar, find the "Watch" section
   - Click the "+" icon to add a watch expression
   
   **In PyCharm:**
   - In the Debug panel, find the "Watches" tab
   - Click the "+" icon or right-click → "New Watch"

2. **Add useful watch expressions:**
   Add these expressions to monitor during debugging:
   ```python
   self.request.method
   self.request.query_params.get('minutes')
   queryset.count()
   len(list(queryset))
   ```

3. **Set a breakpoint in `get_queryset`:**
   ```python
   def get_queryset(self):
       queryset = HeartRateReading.objects.all()
       
       minutes = self.request.query_params.get('minutes')  # ← Breakpoint here
   ```

4. **Debug and observe watches:**
   - Start debugging
   - Access the API with different parameters:
   ```bash
   curl http://localhost:8000/api/heartrate/
   curl "http://localhost:8000/api/heartrate/?minutes=5"
   curl "http://localhost:8000/api/heartrate/?minutes=30"
   ```
   - Observe how watch expressions update with each request

5. **Add complex watch expressions:**
   ```python
   timezone.now() - timedelta(minutes=5)
   HeartRateReading.objects.filter(bpm__gt=100).count()
   stats.get('avg_bpm', 'N/A') if 'stats' in dir() else 'Not defined'
   ```

#### Part B: Conditional Breakpoints

6. **Create a conditional breakpoint:**
   
   **In VSCode:**
   - Right-click on an existing breakpoint (or in the gutter)
   - Select "Edit Breakpoint..."
   - Enter a condition expression
   
   **In PyCharm:**
   - Right-click on a breakpoint
   - Select "More" or click the breakpoint settings
   - Enter the condition in the "Condition" field

7. **Set a conditional breakpoint in `get_queryset`:**
   - Set a breakpoint on line `queryset = queryset.filter(created_at__gte=cutoff_time)`
   - Add condition: `minutes is not None and int(minutes) > 10`
   
   ```python
   if minutes:
       try:
           minutes = int(minutes)
           cutoff_time = timezone.now() - timedelta(minutes=minutes)
           queryset = queryset.filter(created_at__gte=cutoff_time)  # ← Conditional breakpoint
   ```

8. **Test the conditional breakpoint:**
   ```bash
   # This will NOT trigger the breakpoint (minutes=5, which is <= 10)
   curl "http://localhost:8000/api/heartrate/?minutes=5"
   
   # This WILL trigger the breakpoint (minutes=15, which is > 10)
   curl "http://localhost:8000/api/heartrate/?minutes=15"
   ```

9. **Create a hit count breakpoint:**
   
   **In VSCode:**
   - Edit breakpoint → Change type to "Hit Count"
   - Enter "3" - breaks on 3rd hit
   
   **In PyCharm:**
   - In breakpoint settings, set "Suspend policy" 
   - Use "Pass count" and set it to 3

   Make call 3 times to trigger the breakpoint.

   > **Tip:** You may notice that this function triggers **twice** per call. You can use **Call Stack** panel to investigate which functions are evaluating this code.

10. **Create a log point (non-breaking breakpoint):**
    
    **In VSCode:**
    - Right-click in gutter → "Add Logpoint..."
    - Enter message: `Minutes filter applied: {minutes}, cutoff: {cutoff_time}`
    - The message prints to Debug Console without pausing
    
    **In PyCharm:**
    - Edit breakpoint → Uncheck "Suspend"
    - Check "Log message to console" or "Evaluate and log"
    - Enter: `"Minutes filter: " + str(minutes)`

### Key Concepts

- **Watch Expression:** An expression that's continuously evaluated and displayed during debugging
- **Conditional Breakpoint:** A breakpoint that only pauses when a specified condition is true
- **Hit Count Breakpoint:** A breakpoint that triggers after being hit a specific number of times
- **Log Point:** A breakpoint that logs a message without pausing execution
- **Expression Evaluation:** Watch expressions and conditions are evaluated in the current scope

---

## Task 6: Remote Debugging with Docker

### Overview
Learn to debug applications running inside Docker containers, a crucial skill for debugging containerized and cloud-deployed applications.

### Step-by-Step Instructions

1. **Review the existing Dockerfile:**
   The project already has a Dockerfile. Let's create a debug-specific configuration.

2. **Create a debug-enabled Dockerfile:**
   Create a new file `Dockerfile.debug` in the `polarh10-backend` folder:
   
   ```dockerfile
   FROM python:3.10-slim
   
   WORKDIR /app
   
   # Install debugpy for remote debugging
   RUN pip install debugpy
   
   # Copy requirements and install dependencies
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   # Copy application code
   COPY . .
   
   # Expose both the application port and debug port
   EXPOSE 8000 5678
   
   # Start with debugpy waiting for connection
   CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "manage.py", "runserver", "0.0.0.0:8000", "--noreload"]
   ```

3. **Create a docker-compose.debug.yml:**
   Create a new file `polarh10-backend/docker-compose.debug.yml`:
   ```yaml
   version: '3.8'
   
   services:
     backend-debug:
       build:
         context: .
         dockerfile: Dockerfile.debug
       ports:
         - "8000:8000"
         - "5678:5678"
       volumes:
         - .:/app
       environment:
         - DJANGO_DEBUG=True
         - DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
   ```

4. **Build and run the debug container:**

- Open Docker Desktop App.
- Build container
   ```bash
   cd polarh10-backend
   docker-compose -f docker-compose.debug.yml build
   docker-compose -f docker-compose.debug.yml up
   ```

5. **Configure VSCode for remote debugging:**
   Add a new configuration to `.vscode/launch.json`:
   
   ```json
   {
       "name": "Python: Remote Attach (Docker)",
       "type": "debugpy",
       "request": "attach",
       "connect": {
           "host": "localhost",
           "port": 5678
       },
       "pathMappings": [
           {
               "localRoot": "${workspaceFolder}/polarh10-backend",
               "remoteRoot": "/app"
           }
       ],
       "justMyCode": false
   }
   ```

6. **Configure PyCharm for remote debugging:**
   - Go to Run → Edit Configurations
   - Click "+" → Python Debug Server
   - Configure:
     - Name: `Docker Remote Debug`
     - IDE host name: `localhost`
     - Port: `5678`
     - Path mappings: `$PROJECT_DIR$/polarh10-backend` → `/app`

7. **Connect the debugger:**
   
   **In VSCode:**
   - Select "Python: Remote Attach (Docker)" from the debug dropdown
   - Press F5 to connect
   - The container should now continue starting Django
   
   **In PyCharm:**
   - Start the "Docker Remote Debug" configuration
   - PyCharm connects to the waiting debugpy server

8. **Set breakpoints and debug:**
   - Open `polarh10-backend/heartrate/views.py`
   - Set a breakpoint in the `get_queryset` method
   - Access the API:
   ```bash
   curl http://localhost:8000/api/heartrate/?minutes=5
   ```
   - The debugger should pause at your breakpoint


11. **Clean up:**
    ```bash
    # If you're still in polarh10-backend directory:
    docker-compose -f docker-compose.debug.yml down
    ```


### Key Concepts

- **Remote Debugging:** Connecting a debugger to a process running on a different machine or container
- **debugpy:** Microsoft's Python debugger that supports remote debugging
- **Path Mappings:** Maps local source paths to paths inside the container
- **Port Exposure:** Debug port (5678) must be accessible from your IDE
- **Volume Mounts:** Allow code changes without rebuilding the container
- You can add **--wait-for-client** flag to Dockerfile to make the application wait for debugger connection before starting

---

## Summary of Key Commands

### VSCode Shortcuts

| Action | Shortcut |
|--------|----------|
| Start/Continue Debugging | F5 |
| Stop Debugging | Shift+F5 |
| Restart Debugging | Ctrl+Shift+F5 |
| Step Over | F10 |
| Step Into | F11 |
| Step Out | Shift+F11 |
| Toggle Breakpoint | F9 |
| Open Debug Console | Ctrl+Shift+Y |

### PyCharm Shortcuts

| Action | Shortcut |
|--------|----------|
| Start Debugging | Shift+F9 |
| Stop Debugging | Ctrl+F2 |
| Resume | F9 |
| Step Over | F8 |
| Step Into | F7 |
| Step Out | Shift+F8 |
| Toggle Breakpoint | Ctrl+F8 |
| Evaluate Expression | Alt+F8 |
| View Breakpoints | Ctrl+Shift+F8 |

---

## Best Practices

1. **Prefer conditional breakpoints** — Avoid stopping at every iteration in loops
2. **Use log points for tracing** — Less intrusive than breakpoints for understanding flow
3. **Watch expressions for key values** — Monitor important variables without manual inspection
4. **Learn keyboard shortcuts** — Significantly speeds up debugging workflow
5. **Disable "Just My Code" when needed** — To debug into framework/library code
6. **Use exception breakpoints** — Catch errors at the source, not after propagation

---

END LAB
