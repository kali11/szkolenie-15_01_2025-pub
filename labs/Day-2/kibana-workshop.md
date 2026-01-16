# Working with Kibana Workshop

## Workshop Overview

In this practical workshop, you will learn how to use Kibana to visualize and analyze log data stored in Elasticsearch. You'll learn how to connect to Elasticsearch, create data views, search and filter logs, create visualizations, and build comprehensive dashboards for monitoring your applications.

### Learning Objectives

By the end of this workshop, you will be able to:
- Deploy and access Kibana using Docker
- Connect Kibana to Elasticsearch and verify the connection
- Create data views for log data
- Search and filter logs using Kibana Query Language (KQL)
- Create various types of visualizations (bar charts, pie charts, line charts, data tables)
- Build and customize dashboards with multiple visualizations
- Save searches and dashboards for future use
- Export and share dashboards

### Prerequisites

- **Day 2, workshop "ELK Stack Basics" completed** - Elasticsearch, Logstash, and Filebeat should be running with log data indexed
- Docker and Docker Compose installed and running
- Basic familiarity with command-line interface
- Basic understanding of JSON format
- Access to the ELK stack setup from the previous workshop
- At least 4GB of available RAM (for Elasticsearch and Kibana containers)
- Web browser for accessing Kibana UI

---

## Task 1: Set up and access Kibana

### Overview
Deploy Kibana in a Docker container and connect it to your existing Elasticsearch cluster. You'll then access the Kibana web interface and verify the connection.

### Step-by-Step Instructions

1. **Verify Elasticsearch is running** (from the previous workshop):
   ```bash
   curl http://localhost:9200/_cluster/health?pretty
   ```
   
   The cluster status should be `"green"` or `"yellow"`. If Elasticsearch is not running, start it first using the instructions from the ELK Stack Basics workshop.

2. **Check if the `elk-network` Docker network exists:**
   ```bash
   docker network ls | grep elk-network
   ```
   
   If it doesn't exist, create it:
   ```bash
   docker network create elk-network
   ```

3. **Start Kibana container:**
   ```bash
   docker run -d \
     --name kibana \
     --network elk-network \
     -p 5601:5601 \
     -e "ELASTICSEARCH_HOSTS=http://elasticsearch:9200" \
     kibana:9.2.3
   ```
   
   This command:
   - Runs Kibana in detached mode (`-d`)
   - Names the container `kibana`
   - Connects to the `elk-network` (same network as Elasticsearch)
   - Maps port 5601 (Kibana web interface) to host
   - Configures Elasticsearch connection URL
   - Uses Kibana version 9.2.3 (should match your Elasticsearch version)

4. **Wait for Kibana to start** (it may take 30-60 seconds):
   ```bash
   # Check container logs
   docker logs -f kibana
   # Press Ctrl+C when you see "Kibana is now available" or "Server running" message
   ```
   
   Look for messages like: `"message":"http server running at http://0.0.0.0:5601"` or `"Kibana is now available"`.

5. **Verify Kibana is running** by checking the container status:
   ```bash
   docker ps | grep kibana
   ```
   
   You should see the kibana container in the list with status "Up".

6. **Access Kibana in your web browser:**
   ```
   http://localhost:5601
   ```
   
   The Kibana welcome page should load. If you see an error, wait a bit longer for Kibana to fully initialize.

7. **Verify Elasticsearch connection** in Kibana:
   - On the Kibana welcome page, you may see a setup wizard or status page
   - Look for any connection status indicators
   - If there are any errors about Elasticsearch connection, verify that:
     - Elasticsearch is running: `curl http://localhost:9200`
     - Both containers are on the same network: `docker network inspect elk-network`
     - Kibana can reach Elasticsearch: `docker exec kibana ping elasticsearch`

8. **Navigate the Kibana interface:**
   - Explore the left sidebar menu (hamburger icon ☰)
   - You should see options like: Discover, Dashboard, Visualize Library, Dev Tools, etc.
   - Click on different menu items to familiarize yourself with the interface

9. **Check Kibana status** using the API:
   ```bash
   curl http://localhost:5601/api/status
   ```
   
   This returns detailed status information about Kibana and its connection to Elasticsearch.

### Key Concepts
- **Kibana version compatibility**: Kibana version must match Elasticsearch version (both 9.2.3 in this workshop)
- **Network connectivity**: Kibana and Elasticsearch must be on the same Docker network to communicate
- **Port mapping**: Port 5601 is the default Kibana web interface port
- **Connection configuration**: Kibana connects to Elasticsearch using the `ELASTICSEARCH_HOSTS` environment variable
- **Initialization time**: Kibana takes time to start and connect to Elasticsearch on first launch

---

## Task 2: Create data views and explore data

### Overview
Create a data view in Kibana to access your log data from Elasticsearch. Data views define which indices Kibana should query and how to interpret the data fields. Data views have replaced the older "index patterns" terminology in newer versions of Kibana.

### Step-by-Step Instructions

1. **Verify you have log indices in Elasticsearch:**
   ```bash
   curl http://localhost:9200/_cat/indices?v | grep "^logs-"
   ```
   
   You should see one or more indices with names like `logs-2025.01.15` (with today's date). If you don't have any indices, you may need to generate some logs first by running the Django application and making API requests.

2. **Open Kibana in your browser** (if not already open):
   ```
   http://localhost:5601
   ```

3. **Navigate to Data Views:**
   - Click on the hamburger menu (☰) in the top left
   - Scroll down and click on **"Stack Management"** (or use the search bar to find it)
   - In the left sidebar under "Kibana", click on **"Data Views"**
   - Alternatively, you can create a data view directly from Discover or Lens (see step 4)

4. **Create a new data view:**
   - **Option A - From Stack Management:**
     - In the Data Views page, click the **"Create data view"** button (usually at the top right)
   - **Option B - From Discover or Lens (recommended):**
     - Click on **"Discover"** in the left sidebar
     - Click on the data view selector at the top (it may show "No data view" or a dropdown)
     - Click **"Create a data view"**
   - In the "Name" field, enter: `polarh10-backend-logs`
     - This pattern will match all indices starting with "logs-" (e.g., `logs-2025.01.15`, `logs-2025.01.16`)
   - In the "Index pattern" field (or "Index pattern or data stream" field), Kibana will automatically suggest matching indices as you type
     - You can use wildcards like `logs-*` to match multiple indices
     - You can also specify multiple indices separated by commas: `logs-2025.01.15,logs-2025.01.16`

5. **Select the time field:**
   - Kibana will analyze your indices and show available fields
   - In the "Timestamp field" dropdown, select **`@timestamp`**
     - This field is used by Kibana for time-based filtering and visualizations
   - If `@timestamp` is not available, check that your logs have this field. You may need to wait a moment for Kibana to analyze the indices.
   - If your data doesn't have time-based data, you can select **"I don't want to use the time filter"**
   - Click **"Save data view to Kibana"**

6. **Verify the data view was created:**
   - You should see a confirmation message
   - The data view `logs-*` should now appear in the list (if viewing from Stack Management)
   - In Discover, the data view should now be selected and your data should be visible
   - You should see information about:
     - Number of indices matched
     - Number of fields discovered
     - Storage size

7. **Explore the field list:**
   - In Discover, you can see fields in the left sidebar
   - Or go to **Stack Management** → **Data Views** → Click on the `logs-*` data view name
   - Scroll through the list of fields
   - You should see fields like:
     - `@timestamp` (date)
     - `level` (text/keyword)
     - `service` (text/keyword)
     - `logger` (text/keyword)
     - `message` (text)
     - `hostname` (text/keyword)
   - Notice the field types (text, keyword, date, etc.)
   - Click on any field to see more details including:
     - Field type
     - Format
     - Searchable/aggregatable status

8. **Set as default data view** (optional):
   - In the data view details page or Discover, you can set it as the default
   - This makes it automatically selected when using Discover or creating new visualizations

9. **Navigate to Discover view:**
   - Click on **"Discover"** in the left sidebar (or use the hamburger menu)
   - The Discover view should now show your log data
   - You should see a timeline histogram at the top
   - Log entries should be displayed in a table format below

10. **Explore the Discover interface:**
    - **Time picker**: Located at the top right, allows you to filter by time range
    - **Search bar**: At the top, for entering queries
    - **Field list**: On the left sidebar, shows all available fields
    - **Document table**: Main area showing log entries
    - **Histogram**: Visual representation of log volume over time

11. **View a sample log document:**
    - Click on any log entry in the table to expand it
    - You'll see the full JSON structure of the log document
    - Notice all the fields and their values
    - Click the document again to collapse it

12. **Test time range filtering:**
    - Click on the time picker (top right)
    - Select "Last 15 minutes" or "Last 1 hour"
    - Click "Update"
    - The histogram and log entries should update to show only logs in that time range

### Key Concepts
- **Data views**: Define which Elasticsearch indices Kibana should query (supports wildcards like `logs-*`). Data views replaced "index patterns" in newer Kibana versions.
- **Time field**: Required field for time-based operations in Kibana (typically `@timestamp`). Can be omitted if data is not time-based.
- **Field types**: 
  - **Text**: Full-text searchable, analyzed fields
  - **Keyword**: Exact match, aggregatable fields (often have `.keyword` sub-field)
  - **Date**: Time-based fields for temporal analysis
- **Discover view**: Interactive interface for exploring and searching log data
- **Time picker**: Essential tool for filtering data by time range in all Kibana views
- **Creating data views**: Can be done from Stack Management, Discover, or Lens - the most convenient way is from Discover when you first need to access your data

---

## Task 3: Search and filter logs in Discover

### Overview
Learn how to search and filter logs using Kibana Query Language (KQL) and the filtering interface. You'll create complex queries, save searches, and export results.

### Step-by-Step Instructions

1. **Open Discover view** in Kibana:
   - Click on **"Discover"** in the left sidebar
   - Ensure the `polarh10-backend-logs` data view is selected (shown at the top in the data view selector)

2. **Set an appropriate time range:**
   - Click the time picker (top right)
   - Select "Last 1 hour" or a range that includes your log data
   - Click "Update"

3. **Basic search using KQL (Kibana Query Language):**
   - Click in the search bar at the top
   - Enter a simple text search: `heartrate`
   - Press Enter
   - The results should filter to show only logs containing "heartrate" in searchable fields

4. **Search in a specific field:**
   - Clear the search bar
   - Enter: `level : "ERROR"`
   - Press Enter
   - This shows only ERROR level logs
   - If you don't have ERROR logs, try: `level : "INFO"` or `level : "DEBUG"`

5. **Combine multiple conditions (AND):**
   - Clear the search bar
   - Enter: `level : "INFO" and service : "polarh10-backend"`
   - Press Enter
   - This shows INFO logs from the polarh10-backend service

6. **Use OR conditions:**
   - Clear the search bar
   - Enter: `level : "ERROR" or level : "WARNING"`
   - Press Enter
   - This shows logs with either ERROR or WARNING level

7. **Search in message field:**
   - Clear the search bar
   - Enter: `message : "queryset"`
   - Press Enter
   - This searches for "queryset" specifically in the message field

8. **Use wildcards:**
   - Clear the search bar
   - Enter: `message : "get_*"`
   - Press Enter
   - This finds messages starting with "get_"

9. **Use filters (alternative to KQL):**
   - Clear the search bar
   - Click the **"Add filter"** button (usually below the search bar)
   - In the filter dialog:
     - Field: Select `level`
     - Operator: Select "is"
     - Value: Enter or select "INFO"
   - Click "Save"
   - A filter pill should appear below the search bar

10. **Add multiple filters:**
    - Click "Add filter" again
    - Field: `service`
    - Operator: "is"
    - Value: "polarh10-backend"
    - Click "Save"
    - You should now have two filter pills

11. **Combine filters with search:**
    - Add the filters from steps 9-10
    - In the search bar, enter: `message : "request"`
    - This combines the filters with the search query

12. **Remove filters:**
    - Click the "X" on any filter pill to remove it
    - Or click "Clear all" to remove all filters

13. **Use the field list for quick filtering:**
    - In the left sidebar, find the `level` field
    - Click on it to expand
    - You'll see a list of unique values with counts
    - Click the "+" icon next to "INFO" (or any value)
    - This automatically adds a filter for that value
    - Click the "-" icon to add a negative filter (exclude that value)

14. **View field statistics:**
    - In the field list, click on `level` field name
    - You'll see a popover with:
      - Top 5 values
      - Field statistics
      - Options to add as filter or column

15. **Add columns to the table:**
    - In the field list, hover over `@timestamp`
    - Click the "Toggle column in table" icon (grid icon)
    - The `@timestamp` column should appear in the table
    - Repeat for `level`, `service`, and `logger` fields
    - You can reorder columns by dragging column headers

16. **Sort results:**
    - Click on the `@timestamp` column header
    - Click again to reverse the sort order
    - Results should be sorted by timestamp

17. **Save a search:**
    - After creating a useful search/filter combination, click **"Save"** button (top right)
    - Enter a name: "INFO logs from polarh10-backend"
    - Optionally add a description
    - Click "Save"
    - The saved search is now available in the "Open" menu

18. **Load a saved search:**
    - Click the **"Open"** button (top right, next to Save)
    - Select your saved search from the list
    - The search and filters should be restored

19. **Export search results:**
    - After performing a search, click the **"Share"** button (top right)
    - Select "CSV Reports" or "Raw documents" (depending on what's available)
    - For CSV: Click "Generate CSV" (may require additional setup)
    - For raw: Copy the JSON or download

20. **Use time-based filtering:**
    - Click the time picker
    - Select "Absolute time range"
    - Set a specific start and end time
    - Click "Update"
    - The histogram and results update to that time range

21. **Auto-refresh data:**
    - Click the time picker
    - At the bottom, toggle "Auto-refresh"
    - Set interval (e.g., 30 seconds)
    - Data will automatically refresh at the specified interval

### Key Concepts
- **KQL (Kibana Query Language)**: Simple, intuitive query language for searching in Kibana
- **Field-specific search**: Use `field : value` syntax to search in specific fields
- **Boolean operators**: `and`, `or`, `not` for combining conditions
- **Filters vs Queries**: Filters are cached and faster; queries are analyzed
- **Field list**: Interactive way to explore data and add filters
- **Saved searches**: Reusable search configurations for common queries
- **Time-based filtering**: Essential for analyzing logs over specific time periods
- **Auto-refresh**: Useful for real-time monitoring of log streams

---

## Task 4: Add more logs

### Overview
Add more logs data (HR readings) to the polarh10-backend application in order to have more data to visualize.

### Step-by-Step Instructions

1. Stop backend Django application.
2. Open `/polarh10-backend/heartrate/management/commands/subscribe_hr.py` and introduce few changes:
   - import logging module
   - create a logger: `logger = logging.getLogger(__name__)`
   - find a place where HR data is displayed:
   ```
   self.stdout.write(
                f'Saved: {reading.bpm} BPM, RR: {reading.rr_interval}ms '
                f'(ID: {reading.id})'
            )
   ```
   and add logging:
   ```
   logger.debug(
         "HR data:",
         extra={
            'BPM': reading.bpm,
            'RR': reading.rr_interval,
            'ID': reading.id,
         }
   )
   ```

3. Start backend Django application again:

**Start Django server:**
```bash
python manage.py runserver
```

**Start Pub/Sub subscriber (separate terminal):**
```bash
python manage.py subscribe_hr --project-id YOUR_PROJECT_ID --subscription-name YOUR_SUBSCRIPTION
```

4. Wait for a few minutes and check the logs in Kibana. Observe new fields in the log data.

> How to distinguish between application logs and HR logs in Kibana?

---

## Task 5: Create visualizations

### Overview
Create various types of visualizations to analyze your log data. You'll create bar charts, pie charts, line charts, and data tables using different aggregations and metrics.

### Step-by-Step Instructions

1. **Navigate to Visualize Library:**
   - Click on the hamburger menu (☰)
   - Click on **"Visualize Library"** (or "Visualize" in older versions)
   - Alternatively, go to: `http://localhost:5601/app/visualize`

2. **Create a line chart - BPM:**
   - Click **"Create visualization"** button and **Lens**
   - Select **"Line"** chart type
   - Select the `polarh10-backend-logs` data view
   - You'll see the visualization editor
   - Drag `@timestamp` to the horizontal axis
   - Drag `BPM` to the vertical axis
   - Click the **"Play"** button (▶) or wait for auto-update
   - You should see a line chart showing BPM over time

3. **Create a bar chart - Logs by Level:**
   - Click **"Create visualization"** button and **Lens**
   - Select **"Vertical Bar"** chart type
   - Select the `logs-*` data view
   - You'll see the visualization editor

4. **Configure the bar chart:**
   - In the "Metrics" section (Y-axis):
     - Aggregation: **"Count"** (should be default)
     - Label: "Log Count"
   - In the "Buckets" section (X-axis):
     - Click **"Add"**
     - Aggregation: **"Terms"**
     - Field: Select `level.keyword` (use the `.keyword` field for exact matches)
     - Order by: "Metric: Log Count" (descending)
     - Size: 10
     - Label: "Log Level"
   - Click the **"Play"** button (▶) or wait for auto-update
   - You should see a bar chart showing log counts grouped by level

5. **Customize the bar chart:**
   - Click on "Options" tab (if available)
   - Adjust settings like:
     - Show legend
     - Rotate labels
     - Bar mode (grouped/stacked)
   - Click "Update" to see changes

6. **Save the visualization:**
   - Click **"Save"** button (top right)
   - Name: "Logs by Level"
   - Description: "Bar chart showing distribution of logs by log level"
   - Click "Save"

7. **Create a pie chart - Logs by Service:**
   - Click "Visualize Library" again
   - Click **"Create visualization"**
   - Select **"Pie"** chart type
   - Select the `logs-*` data view

8. **Configure the pie chart:**
   - Metrics section:
     - Aggregation: **"Count"**
   - Buckets section:
     - Click **"Add"**
     - Aggregation: **"Terms"**
     - Field: `service.keyword`
     - Order by: "Metric: Count" (descending)
     - Size: 5
     - Label: "Service"
   - Click **"Play"** button
   - You should see a pie chart showing log distribution by service

9. **Save the pie chart:**
   - Click **"Save"**
   - Name: "Logs by Service"
   - Description: "Pie chart showing log distribution by service"
   - Click "Save"

10. **Create a line chart - Logs over Time:**
   - Click "Visualize Library"
   - Click **"Create visualization"**
   - Select **"Line"** chart type
   - Select the `logs-*` data view

11. **Configure the line chart:**
    - Metrics section:
      - Aggregation: **"Count"**
      - Label: "Log Count"
    - Buckets section:
      - Click **"Add"**
      - Aggregation: **"Date Histogram"**
      - Field: `@timestamp`
      - Interval: Select "Auto" or "1 minute" (depending on your data volume)
      - Label: "Time"
    - Click **"Play"** button
    - You should see a line chart showing log volume over time

12. **Add a split series to the line chart:**
    - In Buckets section, click **"Add"** again
    - Aggregation: **"Terms"**
    - Field: `level.keyword`
    - Order by: "Metric: Count" (descending)
    - Size: 5
    - Label: "Split by Level"
    - Click **"Play"**
    - You should now see multiple lines, one for each log level

13. **Save the line chart:**
    - Click **"Save"**
    - Name: "Logs over Time by Level"
    - Description: "Line chart showing log volume over time, split by log level"
    - Click "Save"

14. **Create a data table - Top Log Messages:**
    - Click "Visualize Library"
    - Click **"Create visualization"**
    - Select **"Data Table"** (or "Table")
    - Select the `logs-*` data view

15. **Configure the data table:**
    - Metrics section:
      - Aggregation: **"Count"**
      - Label: "Count"
    - Buckets section:
      - Click **"Add"**
      - Aggregation: **"Terms"**
      - Field: `message.keyword` (or `message` if keyword not available)
      - Order by: "Metric: Count" (descending)
      - Size: 10
      - Label: "Message"
    - Click **"Play"** button
    - You should see a table with the most frequent log messages

16. **Add additional metrics to the table:**
    - In Metrics section, click **"Add"**
    - Aggregation: **"Average"**
    - Field: If you have numeric fields, select one (otherwise skip this step)
    - Or add another count metric with a different label

17. **Save the data table:**
    - Click **"Save"**
    - Name: "Top Log Messages"
    - Description: "Table showing most frequent log messages"
    - Click "Save"

18. **Create a metric visualization - Total Log Count:**
    - Click "Visualize Library"
    - Click **"Create visualization"**
    - Select **"Metric"** (or "Number")
    - Select the `logs-*` data view

19. **Configure the metric:**
    - Metrics section:
      - Aggregation: **"Count"**
      - Label: "Total Logs"
    - Click **"Play"** button
    - You should see a single number showing the total count of logs

20. **Add multiple metrics:**
    - Click **"Add"** in Metrics section
    - Aggregation: **"Cardinality"** (unique count)
    - Field: `service.keyword`
    - Label: "Unique Services"
    - Click **"Play"**
    - You should see multiple metric values

21. **Save the metric visualization:**
    - Click **"Save"**
    - Name: "Log Statistics"
    - Description: "Key metrics about log data"
    - Click "Save"

22. **View all saved visualizations:**
    - In "Visualize Library", you should see all your saved visualizations
    - Click on any visualization name to open and edit it
    - Use the search bar to filter visualizations

23. **Edit an existing visualization:**
    - Click on "Logs by Level" visualization
    - Make changes (e.g., change the size in Terms aggregation)
    - Click **"Save"** to update
    - Or click **"Save as"** to create a copy with a new name

### Key Concepts
- **Visualization types**: Different chart types are suited for different data analysis needs
- **Aggregations**: 
  - **Metrics**: Calculations (Count, Average, Sum, Min, Max, Cardinality)
  - **Buckets**: Grouping (Terms, Date Histogram, Range, Filters)
- **Field types matter**: Use `.keyword` fields for Terms aggregations (exact matches)
- **Date Histogram**: Essential for time-series visualizations
- **Split series**: Add multiple dimensions to visualizations (e.g., time + category)
- **Saved visualizations**: Reusable components that can be added to dashboards
- **Auto-refresh**: Visualizations can be set to auto-refresh for real-time monitoring

---

## Task 5: Build dashboards

### Overview
Create comprehensive dashboards by combining multiple visualizations. You'll arrange panels, configure time ranges, and create a monitoring dashboard for your application logs.

### Step-by-Step Instructions

1. **Navigate to Dashboard:**
   - Click on the hamburger menu (☰)
   - Click on **"Dashboard"**
   - Alternatively, go to: `http://localhost:5601/app/dashboards`

2. **Create a new dashboard:**
   - Click **"Create dashboard"** button
   - You'll see an empty dashboard canvas

3. **Add your first visualization:**
   - Click **"Add panel"** or **"Add"** button
   - Select **"Add from library"**
   - You should see a list of your saved visualizations
   - Select **"Logs by Level"** (the bar chart you created)
   - Click "Save" or the visualization should appear on the dashboard

4. **Add more visualizations:**
   - Click **"Add panel"** again
   - Select **"Add from library"**
   - Add **"Logs by Service"** (pie chart)
   - Repeat to add:
     - "Logs over Time by Level" (line chart)
     - "Top Log Messages" (data table)
     - "Log Statistics" (metric)

5. **Arrange dashboard panels:**
   - Click and drag panel headers to move them
   - Resize panels by dragging the corners or edges
   - Arrange them in a logical layout:
     - Metrics at the top
     - Charts in the middle
     - Tables at the bottom
   - Try different layouts to see what works best

6. **Configure dashboard time range:**
   - At the top right, click the time picker
   - Select "Last 1 hour" or "Last 24 hours"
   - Click "Update"
   - All visualizations should update to reflect the new time range
   - Notice the time range applies to all panels

7. **Use dashboard filters:**
   - Click **"Add filter"** button (usually at the top)
   - Add a filter for `level : "ERROR"` (or any other filter)
   - Click "Save"
   - All visualizations should update to show only ERROR logs
   - This demonstrates how dashboard-level filters affect all panels

8. **Remove the filter:**
   - Click the "X" on the filter pill to remove it
   - Visualizations return to showing all data

9. **Create a filter from a visualization:**
   - In the "Logs by Level" bar chart, click on one of the bars (e.g., "INFO")
   - A context menu should appear
   - Select **"Apply filter"** or **"Filter for value"**
   - The dashboard should add a filter and update all panels

10. **Configure panel settings:**
    - Hover over a panel (e.g., "Log Statistics")
    - Click the gear icon (⚙) or panel menu
    - Explore options like:
      - "Edit visualization"
      - "Inspect" (view underlying data)
      - "Remove from dashboard"
      - "Maximize panel"
    - Click "Maximize panel" to see it full screen
    - Press Escape or click "Minimize" to return

11. **Inspect panel data:**
    - Hover over a panel
    - Click the panel menu (three dots or gear icon)
    - Select **"Inspect"**
    - You'll see:
      - Request (the query sent to Elasticsearch)
      - Response (the data returned)
      - Statistics
    - This is useful for debugging and understanding the data

12. **Add a saved search to the dashboard:**
    - Click **"Add panel"**
    - Select **"Add saved search"** (if available)
    - Select one of your saved searches from Task 3
    - The search results should appear as a panel
    - This is useful for including raw log data in your dashboard

13. **Add a markdown panel (optional):**
    - Click **"Add panel"**
    - Select **"Add markdown"** or **"Markdown"**
    - Enter some text, e.g.:
      ```markdown
      # Application Monitoring Dashboard
      
      This dashboard shows logs from the polarh10-backend application.
      ```
    - Click "Save"
    - The markdown panel appears on the dashboard

14. **Save the dashboard:**
    - Click **"Save"** button (top right)
    - Enter a name: "Application Logs Dashboard"
    - Add a description: "Comprehensive dashboard for monitoring application logs"
    - Optionally add tags: "logs", "monitoring", "elk"
    - Click "Save"

15. **View saved dashboards:**
    - In the Dashboard view, you should see your saved dashboard
    - Click on it to open
    - You can create multiple dashboards for different purposes

16. **Edit the dashboard:**
    - Open your dashboard
    - Click **"Edit"** button (top right)
    - Make changes (add/remove panels, rearrange, etc.)
    - Click **"Save"** to update

17. **Share the dashboard:**
    - Click **"Share"** button (top right)
    - You'll see options:
      - **"Permalink"**: Get a direct link to the dashboard with current time range
      - **"Export"**: Export dashboard as JSON
      - **"PDF Reports"**: Generate PDF (may require additional setup)
    - Copy the permalink to share with others

18. **Set dashboard as default (optional):**
    - In dashboard edit mode, look for "Set as default dashboard" option
    - This makes it the landing page when opening Kibana

19. **Create a dashboard with time comparison:**
    - Create a new dashboard or edit existing one
    - Add the "Logs over Time by Level" line chart
    - In the time picker, enable "Compare to previous period"
    - Select comparison period (e.g., "Previous week")
    - The chart should show current period vs. previous period
    - This is useful for identifying trends and anomalies

20. **Use dashboard variables (advanced, optional):**
    - In dashboard edit mode, look for "Variables" or "Controls"
    - Add a control for filtering by service
    - This creates a dropdown that affects all panels
    - Useful for creating flexible, reusable dashboards

21. **Refresh dashboard data:**
    - Click the refresh button (circular arrow icon) at the top
    - Or set auto-refresh:
      - Click time picker
      - Enable "Auto-refresh"
      - Set interval (e.g., 30 seconds)
    - Dashboard will automatically update at the specified interval

### Key Concepts
- **Dashboard composition**: Combine multiple visualizations into a single view
- **Time range synchronization**: Dashboard time picker applies to all panels
- **Dashboard filters**: Filters at dashboard level affect all visualizations
- **Panel interactions**: Click on visualizations to drill down or filter
- **Saved dashboards**: Reusable monitoring views for different purposes
- **Sharing**: Dashboards can be shared via links or exported
- **Auto-refresh**: Essential for real-time monitoring scenarios
- **Panel inspection**: Debug and understand the data behind visualizations

---

## Task 6: Advanced features and best practices

### Overview
Explore advanced Kibana features including data view management, using Lens for quick visualizations, and best practices for dashboard design and maintenance.

### Step-by-Step Instructions

1. **Manage data views:**
   - Go to **"Stack Management"** → **"Data Views"**
   - Click on your `logs-*` data view
   - Explore the options:
     - **"Refresh field list"**: Update fields if new fields are added to indices
     - **"Edit"**: Modify data view settings
     - **"Delete"**: Remove the data view (be careful!)
     - **"Add field"**: Add runtime fields or scripted fields

2. **Create an index alias (Elasticsearch level):**
   - Data views can reference Elasticsearch aliases
   - Create an alias via Elasticsearch API:
     ```bash
     curl -X POST "http://localhost:9200/_aliases?pretty" \
       -H 'Content-Type: application/json' \
       -d '{
         "actions": [
           {
             "add": {
               "index": "logs-*",
               "alias": "current-logs"
             }
           }
         ]
       }'
     ```
   - This creates an alias that can be used in queries

3. **Use Kibana Lens (if available):**
   - Go to **"Visualize Library"**
   - Click **"Create visualization"**
   - Select **"Lens"** (newer, more intuitive visualization tool)
   - Drag and drop fields to create visualizations quickly
   - Lens provides a more visual, drag-and-drop interface

4. **Create a Lens visualization:**
   - In Lens, drag `@timestamp` to the horizontal axis
   - Drag `level.keyword` to the vertical axis
   - Drag `level.keyword` to the color/split by area
   - A visualization should appear automatically
   - Experiment with different field combinations

5. **Use Dev Tools for advanced queries:**
   - Click on **"Dev Tools"** in the left sidebar
   - This provides a console for running Elasticsearch queries
   - Try a simple query:
     ```json
     GET /logs-*/_search
     {
       "query": {
         "match": {
           "level": "ERROR"
         }
       },
       "size": 10
     }
     ```
   - Click the play button to execute
   - Results appear in the right panel

6. **Create a more complex aggregation in Dev Tools:**
   ```json
   GET /logs-*/_search
   {
     "size": 0,
     "aggs": {
       "levels": {
         "terms": {
           "field": "level.keyword",
           "size": 10
         },
         "aggs": {
           "by_service": {
             "terms": {
               "field": "service.keyword",
               "size": 5
             }
           }
         }
       }
     }
   }
   ```
   - This creates nested aggregations (levels, then services within each level)

7. **Export and import objects:**
   - Go to **"Stack Management"** → **"Saved Objects"**
   - You can see all saved searches, visualizations, and dashboards
   - Select objects and click **"Export"** to download as JSON
   - Use **"Import"** to restore from JSON files
   - Useful for backup and sharing configurations

8. **Create dashboard templates:**
   - Design a dashboard with a good layout
   - Save it with a descriptive name
   - Use it as a template for creating similar dashboards
   - Consider creating templates for:
     - Application monitoring
     - Error analysis
     - Performance metrics

9. **Optimize dashboard performance:**
   - Limit the number of panels (too many can slow down loading)
   - Use appropriate time ranges (shorter ranges = faster queries)
   - Use filters to reduce data volume
   - Consider using data views that match fewer indices

10. **Set up index lifecycle (if needed):**
    - For production, consider setting up Index Lifecycle Management (ILM)
    - This automatically manages index retention and deletion
    - Can be configured in Elasticsearch or via Kibana (if available)

11. **Create alerting rules (if available):**
    - Go to **"Stack Management"** → **"Rules and Connectors"** (or "Alerting")
    - Create a rule that triggers when:
      - Error count exceeds threshold
      - Log volume drops significantly
      - Specific error messages appear
    - Configure notifications (email, Slack, etc.)

12. **Use saved searches in visualizations:**
    - When creating a visualization, you can base it on a saved search
    - This allows you to create visualizations of filtered data
    - Useful for creating focused views of specific log subsets

13. **Create dashboard drill-downs:**
    - In a visualization, configure click actions
    - When users click on a chart element, navigate to a detailed view
    - This creates interactive, explorable dashboards

14. **Use dashboard variables for flexibility:**
    - Create dashboards with variables/controls
    - Allow users to select:
      - Service name
      - Log level
      - Time range
    - This makes dashboards reusable for different contexts

15. **Document your dashboards:**
    - Use markdown panels to add documentation
    - Include:
      - Purpose of the dashboard
      - How to interpret the visualizations
      - Common use cases
      - Troubleshooting tips

16. **Regular maintenance:**
    - Periodically review and update dashboards
    - Remove unused visualizations
    - Update data views if log structure changes
    - Archive old dashboards that are no longer needed

### Key Concepts
- **Data view management**: Keep data views updated as data structure evolves
- **Lens**: Modern, intuitive tool for quick visualization creation
- **Dev Tools**: Powerful interface for advanced Elasticsearch queries
- **Saved Objects**: Manage and export/import all Kibana configurations
- **Performance optimization**: Balance functionality with query performance
- **Alerting**: Set up automated notifications for important events
- **Dashboard design**: Create intuitive, well-documented monitoring views
- **Maintenance**: Regularly review and update dashboards to keep them relevant

---

## Cleanup Instructions

To avoid unnecessary resource usage, you can clean up the resources created during this workshop:

```bash
# Stop and remove Kibana container
docker stop kibana
docker rm kibana

# Note: If you want to keep Elasticsearch, Logstash, and Filebeat running,
# do not stop those containers. Only stop Kibana if you're done with visualizations.

# To stop the entire ELK stack:
docker stop kibana filebeat logstash elasticsearch
docker rm kibana filebeat logstash elasticsearch
docker network rm elk-network

# Optional: Remove configuration directories
# rm -rf logstash/ filebeat/
```

**Note**: If you want to keep the setup for further experimentation, you can just stop the containers without removing them:
```bash
docker stop kibana
# To restart later:
docker start kibana
```

---

## Summary of Key Operations

| Category | Operation | Purpose |
|----------|-----------|---------|
| **Kibana Setup** | `docker run -d --name kibana -p 5601:5601 kibana:9.2.3` | Start Kibana container |
| | Access `http://localhost:5601` | Open Kibana web interface |
| **Data Views** | Stack Management → Data Views → Create (or from Discover/Lens) | Define which indices to query |
| | Select time field (`@timestamp`) | Enable time-based operations |
| **Discover** | Use KQL: `level : "ERROR"` | Search logs with query language |
| | Add filters via UI | Filter logs interactively |
| | Save search | Reuse common queries |
| **Visualizations** | Create → Select chart type | Build data visualizations |
| | Configure metrics and buckets | Define what to visualize |
| | Save visualization | Add to dashboards later |
| **Dashboards** | Create dashboard → Add panels | Combine multiple visualizations |
| | Configure time range | Filter all panels by time |
| | Add dashboard filters | Apply filters to all panels |
| | Save dashboard | Reusable monitoring views |
| **Advanced** | Dev Tools | Run Elasticsearch queries directly |
| | Lens | Quick drag-and-drop visualizations |
| | Saved Objects → Export | Backup configurations |

---

## Best Practices

1. **Data View Naming**: Use descriptive patterns like `logs-*` or `app-logs-*` that clearly indicate the data type
   - Avoid overly broad patterns that match unintended indices
   - Use version-specific patterns if needed (e.g., `logs-v2-*`)

2. **Time Field Configuration**: Always configure the time field when creating data views (unless data is not time-based)
   - Use `@timestamp` as the standard field name
   - Ensure timestamps are in ISO8601 format for proper parsing

3. **Visualization Design**:
   - Keep visualizations focused on specific metrics or questions
   - Use appropriate chart types (line for time-series, bar for categories, pie for proportions)
   - Limit the number of series/segments to maintain readability (5-10 max)
   - Use consistent color schemes across related visualizations

4. **Dashboard Organization**:
   - Place most important metrics at the top
   - Group related visualizations together
   - Use markdown panels for context and documentation
   - Limit dashboard to 10-15 panels for performance
   - Use consistent time ranges across related dashboards

5. **Query Performance**:
   - Use specific time ranges rather than "All time"
   - Apply filters early to reduce data volume
   - Use `.keyword` fields for exact matches and aggregations
   - Avoid querying too many indices simultaneously

6. **Saved Objects Management**:
   - Use descriptive names for saved searches, visualizations, and dashboards
   - Add descriptions to explain purpose and usage
   - Tag objects for easy organization and discovery
   - Regularly review and archive unused objects

7. **Field Usage**:
   - Understand the difference between text and keyword fields
   - Use keyword fields (`.keyword`) for:
     - Exact matches
     - Aggregations
     - Sorting
   - Use text fields for:
     - Full-text search
     - Phrase matching

8. **Time Range Selection**:
   - Use relative time ranges for regular monitoring (Last 1 hour, Last 24 hours)
   - Use absolute ranges for historical analysis
   - Enable auto-refresh for real-time dashboards (with appropriate intervals)

9. **Dashboard Sharing**:
   - Use permalinks for sharing dashboards with specific time ranges
   - Export dashboards as JSON for backup and version control
   - Document dashboards with markdown panels
   - Consider access control when sharing (in production environments)

10. **Maintenance**:
    - Regularly refresh data views when new fields are added
    - Update visualizations when data structure changes
    - Review and optimize slow-loading dashboards
    - Archive or delete unused dashboards and visualizations
    - Monitor Kibana performance and resource usage

11. **Security Considerations** (for production):
    - Enable Elasticsearch security features
    - Use role-based access control (RBAC) in Kibana
    - Restrict access to sensitive data fields
    - Audit dashboard access and usage
    - Use encrypted connections (HTTPS)

12. **Error Handling**:
    - Check for visualization errors (red indicators)
    - Use "Inspect" feature to debug query issues
    - Verify field names and types match your queries
    - Check time range includes data (empty results may indicate time range issues)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Kibana won't start** | Check Elasticsearch is running: `curl http://localhost:9200`<br>Verify network: `docker network inspect elk-network`<br>Check logs: `docker logs kibana`<br>Ensure version matches Elasticsearch (9.2.3) |
| **"Unable to connect to Elasticsearch"** | Verify Elasticsearch is accessible: `curl http://localhost:9200`<br>Check both containers on same network: `docker network inspect elk-network`<br>Test connectivity: `docker exec kibana ping elasticsearch`<br>Check ELASTICSEARCH_HOSTS environment variable |
| **No indices found when creating data view** | Verify indices exist: `curl http://localhost:9200/_cat/indices?v`<br>Generate some logs if indices are empty<br>Check index name pattern matches (should start with "logs-") |
| **Time field not available** | Verify `@timestamp` field exists in your logs<br>Check Logstash configuration is adding `@timestamp`<br>Wait a moment for Kibana to analyze indices<br>Refresh the field list in data view settings |
| **Visualization shows "No results"** | Check time range includes data<br>Verify filters aren't too restrictive<br>Check field names are correct (use `.keyword` for aggregations)<br>Inspect the query using "Inspect" feature |
| **Charts not updating** | Click the refresh button<br>Check time range is appropriate<br>Verify auto-refresh is enabled if needed<br>Clear browser cache |
| **Slow dashboard loading** | Reduce number of panels<br>Shorten time range<br>Add filters to reduce data volume<br>Check Elasticsearch performance: `curl http://localhost:9200/_cluster/health` |
| **Field not available in dropdown** | Refresh field list in data view settings<br>Verify field exists in actual documents<br>Check field name spelling (case-sensitive)<br>Wait for Kibana to finish analyzing indices |
| **Aggregation errors** | Use `.keyword` field for Terms aggregations<br>Verify field type supports the aggregation<br>Check field exists and has data<br>Review error message in visualization |
| **Saved search/visualization not appearing** | Refresh the page<br>Check you're in the correct workspace/space<br>Verify object wasn't deleted<br>Check filters/search criteria |
| **Dashboard filters not working** | Verify filter syntax is correct<br>Check field names match exactly<br>Ensure time range includes filtered data<br>Remove and re-add filters |
| **Export/Share not working** | Check browser console for errors<br>Verify you have necessary permissions<br>Try different export format<br>Check Kibana version supports the feature |
| **Lens not available** | Verify Kibana version (Lens available in 7.3+)<br>Use traditional Visualize editor as alternative<br>Check feature is enabled in configuration |

---

END LAB
