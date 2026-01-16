# ELK Stack Basics Workshop

## Workshop Overview

In this practical workshop, you will learn how to set up and use the ELK (Elasticsearch, Logstash, Filebeat) stack to monitor application logs from a Django application. You'll configure log collection, processing, and storage, then learn how to query and manage log data in Elasticsearch.

### Learning Objectives

By the end of this workshop, you will be able to:
- Configure Django applications to write structured logs to files
- Deploy and configure Elasticsearch single-node cluster using Docker
- Set up Logstash to process and forward logs to Elasticsearch
- Configure Filebeat to collect logs from application files and ship them to Logstash
- Query and search log data using Elasticsearch REST API
- Manage Elasticsearch indices including lifecycle, optimization, and cleanup

### Prerequisites

- **Day 1, workshop "Logging in Python" completed Task 1 and Task 2**
- Docker and Docker Compose installed and running
- Basic familiarity with command-line interface
- Basic understanding of JSON format
- Access to polarh10-backend application code
- Python and Django knowledge (for Task 1)
- At least 4GB of available RAM (for Elasticsearch container)

---

## Task 1: Modify polarh10-backend app to write application logs to file

### Overview
Configure the Django application to write structured JSON logs to a file in addition to stdout. This will create log files that Filebeat can later read and ship to the ELK stack.

### Step-by-Step Instructions

1. **Navigate to the polarh10-backend directory:**
   ```bash
   cd polarh10-backend
   ```

2. **Create a logs directory if it doesn't exist:**
   ```bash
   mkdir -p logs
   ```

3. **Open the Django settings file for editing:**
   ```bash
   # The file is located at: config/settings.py
   ```

4. **Modify the LOGGING configuration** in `config/settings.py`. Find the `LOGGING` dictionary (around line 111) and update it to include a file handler. Replace the existing `LOGGING` configuration with:

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
           'file': {
               'class': 'logging.handlers.RotatingFileHandler',
               'filename': BASE_DIR / 'logs' / 'app.log',
               'maxBytes': 10 * 1024 * 1024,  # 10 MB
               'backupCount': 5,
               'formatter': 'json',
               'encoding': 'utf-8',
           },
       },
       'root': {
           'handlers': ['console'],
           'level': 'DEBUG',
       },
       'loggers': {
           'heartrate': {
               'handlers': ['console_json', 'file'],  # Both console and file
               'level': 'DEBUG',
               'propagate': False,
           },
           'django': {
               'handlers': ['console', 'file'],  # Both console and file
               'level': 'INFO',
               'propagate': False,
           },
       },
   }
   ```

   Key changes:
   - Added a `file` handler using `RotatingFileHandler` for automatic log rotation
   - Configured the file handler to write to `logs/app.log`
   - Set max file size to 10MB with 5 backup files
   - Added the `file` handler to both `heartrate` and `django` loggers
   - Used JSON formatter for the file handler to maintain structured logging

5. **Verify the logs directory exists and is writable:**
   ```bash
   ls -la logs/
   # If the directory doesn't exist or has permission issues, fix them:
   chmod 755 logs
   ```

6. **Test the logging configuration** by starting the Django development server:
   ```bash
   python manage.py runserver
   ```

7. **Generate some test logs** by making a request to the API (in another terminal):
   ```bash
   # Test the heartrate API endpoint
   curl http://localhost:8000/api/heartrate/
   ```

8. **Verify logs are being written to the file:**
   ```bash
   # Check if the log file was created
   ls -lh logs/app.log
   
   # View the last few log entries
   tail -n 5 logs/app.log
   ```

9. **Verify the log format is JSON:**
   ```bash
   # The output should show JSON-formatted log entries
   tail -n 1 logs/app.log | python -m json.tool
   ```

   You should see JSON output with fields like `timestamp`, `level`, `logger`, `message`, `service`, etc.

10. **Stop the Django server** (press Ctrl+C) as we'll start it again later when we need to generate logs for testing.

### Key Concepts
- **File handlers vs Stream handlers**: File handlers write to disk files, while Stream handlers write to stdout/stderr
- **Log rotation**: Prevents log files from growing indefinitely by rotating them when they reach a size limit
- **Structured logging**: JSON format makes logs easier to parse and query in Elasticsearch
- **Handler configuration**: Multiple handlers can be attached to the same logger to write to different destinations

---

## Task 2: Set up Elasticsearch single-node cluster using Docker

### Overview
Deploy Elasticsearch in a Docker container configured as a single-node cluster. This is suitable for development and learning purposes.

### Step-by-Step Instructions

1. **Create a Docker network** for the ELK stack components to communicate:
   ```bash
   docker network create elk-network
   ```

2. **Start Elasticsearch container** with proper configuration:
   ```bash
   docker run -d \
     --name elasticsearch \
     --network elk-network \
     -p 9200:9200 \
     -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
     elasticsearch:9.2.3
   ```

   This command:
   - Runs Elasticsearch in detached mode (`-d`)
   - Names the container `elasticsearch`
   - Connects to the `elk-network`
   - Maps ports 9200 (HTTP API) and 9300 (transport) to host
   - Configures single-node discovery mode
   - Disables security features for development
   - Sets Java heap size to 512MB (adjust based on available memory)

3. **Wait for Elasticsearch to start** (it may take 30-60 seconds):
   ```bash
   # Check container logs
   docker logs -f elasticsearch
   # Press Ctrl+C when you see "started" message
   ```

   Look for a message like: `"message":"started"` in the logs.

4. **Verify Elasticsearch is running** by checking the cluster health:
   ```bash
   curl http://localhost:9200/_cluster/health?pretty
   ```

   You should see a response like:
   ```json
   {
     "cluster_name" : "docker-cluster",
     "status" : "green",
     "timed_out" : false,
     "number_of_nodes" : 1,
     "number_of_data_nodes" : 1,
     ...
   }
   ```

   The `status` field should be `"green"` or `"yellow"` (yellow is acceptable for a single-node cluster).

5. **Get cluster information:**
   ```bash
   curl http://localhost:9200?pretty
   ```

   This returns information about your Elasticsearch cluster including version, name, and cluster UUID.

6. **List all indices** (should be empty initially):
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

   The output should show only headers (no indices yet).

7. **Check node information:**
   ```bash
   curl http://localhost:9200/_cat/nodes?v
   ```

   This shows information about the Elasticsearch node, including heap usage and CPU.

### Key Concepts
- **Single-node cluster**: Elasticsearch can run as a single node for development, eliminating the need for multiple nodes
- **Discovery type**: `single-node` mode automatically configures Elasticsearch for standalone operation
- **REST API**: Elasticsearch exposes a RESTful API on port 9200 for all operations
- **Cluster health**: Green status means all primary and replica shards are allocated; Yellow means primary shards are allocated but replicas are not (normal for single-node)

---

## Task 3: Set up Logstash using Docker and integrate with Elasticsearch

### Overview
Configure Logstash to receive logs from Filebeat, process them, and forward them to Elasticsearch. Logstash acts as the processing layer in the ELK stack.

### Step-by-Step Instructions

1. **Create directories for Logstash configuration:**
   ```bash
   mkdir -p logstash/config
   ```

2. **Create the Logstash configuration file** at `logstash/config/logstash.conf`:
   ```bash
   cat > logstash/config/logstash.conf << 'EOF'
   input {
     beats {
       port => 5044
     }
   }

   filter {
     # Handle timestamp - check if timestamp field exists, otherwise parse from message
     if [timestamp] {
       date {
         match => [ "timestamp", "ISO8601" ]
         target => "@timestamp"
       }
     } else if [message] =~ /^\{/ {
       # If timestamp not already parsed by Filebeat, parse JSON from message
       json {
         source => "message"
         target => "parsed"
       }
       
       if [parsed][timestamp] {
         date {
           match => [ "[parsed][timestamp]", "ISO8601" ]
           target => "@timestamp"
         }
       }
       
       # If fields weren't parsed by Filebeat, extract from parsed JSON
       # Note: Filebeat with ndjson parser may already add these fields at root level
       if ![level] and [parsed][level] {
         mutate {
           add_field => { "level" => "%{[parsed][level]}" }
         }
       }
       
       if ![service] and [parsed][service] {
         mutate {
           add_field => { "service" => "%{[parsed][service]}" }
         }
       }
       
       if ![logger] and [parsed][logger] {
         mutate {
           add_field => { "logger" => "%{[parsed][logger]}" }
         }
       }
       
       # Copy parsed message to message field if it exists
       if [parsed][message] {
         mutate {
           replace => { "message" => "%{[parsed][message]}" }
         }
       }
     }
     
     # Add host information
     mutate {
       add_field => { "hostname" => "%{[host][name]}" }
     }
   }

   output {
     elasticsearch {
       hosts => ["http://elasticsearch:9200"]
       index => "logs-%{+YYYY.MM.dd}"
     }
     
     # Optional: output to stdout for debugging
     stdout {
       codec => rubydebug
     }
   }
   EOF
   ```

   This configuration:
   - **Input**: Listens on port 5044 for Beats protocol (Filebeat will connect here)
   - **Filter**: Parses JSON logs, extracts fields, and normalizes timestamps
   - **Output**: Sends processed logs to Elasticsearch with daily index pattern

3. **Set proper permissions** for the configuration file:
   ```bash
   chmod 644 logstash/config/logstash.conf
   ```

4. **Start Logstash container:**
   ```bash
   docker run -d \
     --name logstash \
     --network elk-network \
     -p 5044:5044 \
     -p 9600:9600 \
     -v "$(pwd)/logstash/config/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro" \
     logstash:9.2.3
   ```

   This command:
   - Runs Logstash in detached mode
   - Connects to the same `elk-network` as Elasticsearch
   - Maps port 5044 (Beats input) and 9600 (monitoring API)
   - Mounts the configuration file as read-only

5. **Wait for Logstash to start** and verify it's running:
   ```bash
   # Check Logstash logs
   docker logs -f logstash
   # Press Ctrl+C when you see "Pipeline started" message
   ```

   Look for: `"message":"Pipeline started"` or similar success message.

6. **Verify Logstash is listening** on the Beats port:
   ```bash
   # Check if port 5044 is listening
   nc -zv localhost 5044
   ```

7. **Test Logstash monitoring API:**
   ```bash
   curl http://localhost:9600/_node/stats?pretty
   ```

   This shows Logstash node statistics including pipeline information.

8. **Verify Logstash can connect to Elasticsearch:**
   ```bash
   # Check Logstash logs for any connection errors
   docker logs logstash | grep -i elasticsearch
   ```

   You should not see any connection errors. If you do, verify that Elasticsearch is running and accessible from the Logstash container.

### Key Concepts
- **Logstash pipeline**: Consists of three stages: input, filter, and output
- **Beats protocol**: Lightweight protocol used by Filebeat to send data to Logstash
- **JSON parsing**: Logstash can parse JSON messages and extract fields for better searchability
- **Index patterns**: Using date patterns in index names (e.g., `logs-2025.01.15`) creates daily indices for better organization
- **Field extraction**: Extracting structured fields from JSON logs enables powerful queries in Elasticsearch

---

## Task 4: Set up Filebeat using Docker to grab logs from polarh10-backend app and send to Elasticsearch through Logstash

### Overview
Configure Filebeat to read log files from the Django application and ship them to Logstash, which will then forward them to Elasticsearch.

### Step-by-Step Instructions

1. **Create directory for Filebeat configuration:**
   ```bash
   mkdir -p filebeat
   ```

2. **Create the Filebeat configuration file** at `filebeat/filebeat.yml`:
   ```bash
   cat > filebeat/filebeat.yml << 'EOF'
   filebeat.inputs:
   - type: filestream
     id: django-logs
     enabled: true
     paths:
       - /var/log/app/*.log
     parsers:
       - ndjson:
           keys_under_root: false
           add_error_key: true
           message_key: message
     multiline.type: pattern
     multiline.pattern: '^\{'
     multiline.negate: true
     multiline.match: after

   output.logstash:
     hosts: ["logstash:5044"]

   logging.level: info
   logging.to_files: false
   logging.to_stderr: false
   EOF
   ```

   This configuration:
   - **Input**: Uses `filestream` input (replaces deprecated `log` input in Filebeat 9.x)
   - **ID**: Unique identifier for this input stream
   - **Paths**: Monitors log files in `/var/log/app/` directory
   - **JSON parsing**: Uses `ndjson` parser to parse JSON logs
   - **Multiline handling**: Handles multi-line log entries
   - **Output**: Sends logs to Logstash on port 5044
   - **Logging**: Logs to stdout (visible via `docker logs filebeat`)

3. **Create the log directory** that Filebeat will monitor (matching the Django app's log location):
   ```bash
   # Ensure the logs directory exists in polarh10-backend
   mkdir -p polarh10-backend/logs
   ```

4. **Start Filebeat container:**
   ```bash
   docker run -d \
     --name filebeat \
     --network elk-network \
     -v "$(pwd)/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro" \
     -v "$(pwd)/logs:/var/log/app:ro" \
     docker.elastic.co/beats/filebeat:9.2.3
   ```

   This command:
   - Runs Filebeat in detached mode
   - Connects to the `elk-network`
   - Mounts the Filebeat configuration file
   - Mounts the Django logs directory as read-only

5. **Verify Filebeat is running:**
   ```bash
   # Check Filebeat container status
   docker ps | grep filebeat
   
   # Check Filebeat logs
   docker logs filebeat
   ```

   You should see messages indicating Filebeat started successfully and is monitoring the log files.

6. **Check if Filebeat is reading log files:**
   ```bash
   # View Filebeat logs for file monitoring status
   docker logs filebeat | grep -i "harvester\|file"
   ```

7. **Generate test logs** by starting the Django application (in another terminal):
   ```bash
   cd polarh10-backend
   python manage.py runserver
   ```

8. **Make some API requests** to generate logs (in another terminal):
   ```bash
   # Make a few requests to generate logs
   curl http://localhost:8000/api/heartrate/
   curl http://localhost:8000/api/heartrate/latest/
   curl http://localhost:8000/api/heartrate/stats/
   ```

9. **Verify logs are being shipped** by checking Filebeat logs:
   ```bash
   docker logs filebeat | tail -20
   ```

   You should see messages about events being published to Logstash.

10. **Check if logs appear in Elasticsearch:**
    ```bash
    # Wait a few seconds for logs to be processed, then check indices
    curl http://localhost:9200/_cat/indices?v
    ```

    You should see an index named something like `logs-2025.01.11` (with today's date).

11. **Query the logs from Elasticsearch:**
    ```bash
    # Get the index name (replace with actual index name from previous step)
    INDEX_NAME={YOUR_INDEX_NAME}
    
    # Query all documents in the index
    curl "http://localhost:9200/${INDEX_NAME}/_search?pretty" | head -50
    ```

    You should see log entries from your Django application.
    > You can also try to execute those queries in a web browser.

12. **Stop the Django server:**

### Key Concepts
- **Filebeat file input**: Monitors specified file paths and reads new log entries
- **JSON parsing**: Filebeat can parse JSON logs before sending them to Logstash
- **Volume mounts**: Docker volumes allow Filebeat container to access host file system
- **Log shipping pipeline**: Filebeat → Logstash → Elasticsearch
- **Real-time monitoring**: Filebeat continuously monitors log files for new entries

---

## Task 5: Querying log data in Elasticsearch

### Overview
Learn how to query and search log data stored in Elasticsearch using the REST API. You'll perform various types of searches including filtering, aggregations, and field-specific queries.

### Step-by-Step Instructions

1. **List all available indices:**
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

   Note the index name(s) that contain your logs (e.g., `logs-2025.01.11`).

2. **Get the index name** and store it in a variable:
   ```bash
   INDEX_NAME=$(curl -s http://localhost:9200/_cat/indices?h=index | grep "^logs-" | head -1)
   echo "Using index: $INDEX_NAME"
   ```

3. **View the index mapping** (field structure):
   ```bash
   curl "http://localhost:9200/${INDEX_NAME}/_mapping?pretty"
   ```

   This shows all fields in your index and their data types. Look for fields like `level`, `service`, `logger`, `message`, `@timestamp`, etc.

4. **Query all documents** in the index (limit to 10 for readability):
   ```bash
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty&size=10" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "match_all": {}
       }
     }'
   ```

   This returns up to 10 log entries. The response includes `hits` array with log documents.

5. **Search for specific log levels** (e.g., ERROR logs):
   ```bash
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "match": {
           "level": "ERROR"
         }
       }
     }'
   ```

   If you don't have ERROR logs, try "INFO" or "DEBUG".

6. **Search by service name:**
   ```bash
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "match": {
           "service": "polarh10-backend"
         }
       }
     }'
   ```

7. **Filter logs by timestamp range:**
   ```bash
   # Get logs from the last hour
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "range": {
           "@timestamp": {
             "gte": "now-1h"
           }
         }
       }
     }'
   ```

8. **Search in the message field** (full-text search):
   ```bash
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "match": {
           "message": "heartrate"
         }
       }
     }'
   ```

   Replace "heartrate" with any text that might appear in your log messages.

9. **Combine multiple conditions** (AND query):
   ```bash
   curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "query": {
         "bool": {
           "must": [
             {
               "match": {
                 "service": "polarh10-backend"
               }
             },
             {
               "range": {
                 "@timestamp": {
                   "gte": "now-1h"
                 }
               }
             }
           ]
         }
       }
     }'
   ```

10. **Use aggregations** to analyze logs by level:
    ```bash
    curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
      -H 'Content-Type: application/json' \
      -d '{
        "size": 0,
        "aggs": {
          "log_levels": {
            "terms": {
              "field": "level.keyword",
              "size": 10
            }
          }
        }
      }'
    ```

    This returns a count of logs grouped by log level.
    
    > **Note:** The `level` field is a text field, so we use `level.keyword` for aggregations. Text fields in Elasticsearch cannot be used directly for aggregations - you must use the `.keyword` sub-field which is automatically created for text fields.

11. **Get log count by service:**
    ```bash
    curl -X GET "http://localhost:9200/${INDEX_NAME}/_search?pretty" \
      -H 'Content-Type: application/json' \
      -d '{
        "size": 0,
        "aggs": {
          "by_service": {
            "terms": {
              "field": "service.keyword",
              "size": 10
            }
          }
        }
      }'
    ```

12. **Format query results** for better readability using `jq` (if installed):
    ```bash
    curl -s -X GET "http://localhost:9200/${INDEX_NAME}/_search" \
      -H 'Content-Type: application/json' \
      -d '{
        "query": {
          "match_all": {}
        },
        "size": 5
      }' | jq '.hits.hits[] | {timestamp: ._source["@timestamp"], level: ._source.level, message: ._source.message}'
    ```

    If `jq` is not installed, the `?pretty` parameter in previous queries provides readable formatting.

### Key Concepts
- **Query DSL**: Elasticsearch uses a JSON-based query language for searching
- **Match queries**: Full-text search across analyzed fields
- **Term queries**: Exact match searches for keyword fields
- **Range queries**: Filter documents by date, number, or string ranges
- **Bool queries**: Combine multiple queries with AND, OR, NOT logic
- **Aggregations**: Analyze and summarize data (counts, averages, groupings)
- **Index patterns**: Daily indices (logs-YYYY.MM.dd) allow efficient time-based queries

---

## Task 6: Index management in Elasticsearch

### Overview
Learn how to manage Elasticsearch indices including viewing statistics, creating templates, updating settings, and performing cleanup operations.

### Step-by-Step Instructions

1. **View all indices with detailed information:**
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```

   The output shows:
   - `health`: Index health status (green/yellow/red)
   - `status`: Index status (open/close)
   - `index`: Index name
   - `docs.count`: Number of documents
   - `store.size`: Disk space used

2. **Get detailed statistics** for a specific index:
   ```bash
   INDEX_NAME=$(curl -s http://localhost:9200/_cat/indices?h=index | grep "^logs-" | head -1)
   curl "http://localhost:9200/${INDEX_NAME}/_stats?pretty" | head -100
   ```

   This shows comprehensive statistics including document count, size, indexing performance, etc.

3. **View index settings:**
   ```bash
   curl "http://localhost:9200/${INDEX_NAME}/_settings?pretty"
   ```

   This displays index configuration including number of shards, replicas, refresh interval, etc.

4. **Check index health status:**
   ```bash
   curl "http://localhost:9200/_cat/indices/${INDEX_NAME}?v&h=health,status,index,docs.count,store.size"
   ```

5. **Create an index template** for automatic index creation with consistent settings:
   ```bash
   curl -X PUT "http://localhost:9200/_index_template/logs-template?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "index_patterns": ["logs-*"],
       "template": {
         "settings": {
           "number_of_shards": 1,
           "number_of_replicas": 0,
           "refresh_interval": "5s"
         },
         "mappings": {
           "properties": {
             "@timestamp": {
               "type": "date"
             },
             "level": {
               "type": "keyword"
             },
             "service": {
               "type": "keyword"
             },
             "logger": {
               "type": "keyword"
             },
             "message": {
               "type": "text"
             }
           }
         }
       },
       "priority": 1
     }'
   ```

   This template will be applied to all new indices matching the pattern `logs-*`.

6. **Verify the template was created:**
   ```bash
   curl "http://localhost:9200/_index_template/logs-template?pretty"
   ```

7. **Update index settings** (e.g., change refresh interval):
   ```bash
   curl -X PUT "http://localhost:9200/${INDEX_NAME}/_settings?pretty" \
     -H 'Content-Type: application/json' \
     -d '{
       "index": {
         "refresh_interval": "10s"
       }
     }'
   ```

   This changes how often the index is refreshed (affects search latency vs. indexing performance).

8. **View index mapping** to see field definitions:
   ```bash
   curl "http://localhost:9200/${INDEX_NAME}/_mapping?pretty"
   ```

9. **Get index aliases** (if any):
   ```bash
   curl "http://localhost:9200/${INDEX_NAME}/_alias?pretty"
   ```

   Aliases provide alternative names for indices, useful for index rotation strategies.

10. **Create an alias** for easier querying:
    ```bash
    curl -X POST "http://localhost:9200/_aliases?pretty" \
      -H 'Content-Type: application/json' \
      -d '{
        "actions": [
          {
            "add": {
              "index": "'${INDEX_NAME}'",
              "alias": "logs-current"
            }
          }
        ]
      }'
    ```

    Now you can query using `logs-current` instead of the full index name.

11. **Query using the alias:**
    ```bash
    curl "http://localhost:9200/logs-current/_search?pretty&size=5"
    ```

12. **View index segments** (internal structure):
    ```bash
    curl "http://localhost:9200/${INDEX_NAME}/_segments?pretty" | head -50
    ```

    This shows Lucene segments information (advanced topic).

13. **Force merge** an index to optimize it (reduce segment count):
    ```bash
    # Note: Force merge is read-only operation during merge, use with caution
    curl -X POST "http://localhost:9200/${INDEX_NAME}/_forcemerge?max_num_segments=1&pretty"
    ```

    This can take time for large indices. It optimizes the index by merging segments.

14. **List all index templates:**
    ```bash
    curl "http://localhost:9200/_index_template?pretty"
    ```

15. **Delete old indices** (cleanup example - be careful!):
    ```bash
    # First, list indices to see what would be deleted
    curl -s http://localhost:9200/_cat/indices?h=index | grep "^logs-"
    
    # Delete a specific old index (replace with actual old index name)
    # curl -X DELETE "http://localhost:9200/logs-2025.01.10?pretty"
    ```

    **Warning**: Only delete indices you're sure you don't need. In production, use Index Lifecycle Management (ILM) policies.

16. **Understand index lifecycle patterns:**
    ```bash
    # View all log indices
    curl -s "http://localhost:9200/_cat/indices/logs-*?v&s=index"
    ```

    Daily indices (logs-YYYY.MM.dd) allow you to:
    - Delete old data easily (delete entire indices)
    - Query specific date ranges efficiently
    - Manage retention policies simply

### Key Concepts
- **Index templates**: Define settings and mappings for indices created automatically
- **Index settings**: Control behavior like refresh interval, shard count, replicas
- **Index aliases**: Provide alternative names for indices, enabling zero-downtime reindexing
- **Force merge**: Optimizes index by reducing number of segments (improves query performance)
- **Index lifecycle**: Daily indices enable simple retention and cleanup strategies
- **Shards and replicas**: Shards split data across nodes; replicas provide redundancy (single-node has 0 replicas)

---

## Cleanup Instructions

To avoid unnecessary resource usage, clean up the resources created during this workshop:

```bash
# Stop and remove containers
docker stop filebeat logstash elasticsearch
docker rm filebeat logstash elasticsearch

# Remove the Docker network
docker network rm elk-network

# Optional: Remove Docker volumes (if any were created)
docker volume ls | grep elk
# docker volume rm <volume-name>  # If volumes exist

# Optional: Clean up log files
# rm -rf polarh10-backend/logs/app.log*

# Optional: Remove configuration directories
# rm -rf logstash/ filebeat/
```

**Note**: If you want to keep the setup for further experimentation, you can just stop the containers without removing them:
```bash
docker stop filebeat logstash elasticsearch
# To restart later:
docker start elasticsearch logstash filebeat
```

---

## Summary of Key Commands

| Category | Command | Purpose |
|----------|---------|---------|
| **Docker** | `docker run -d --name <name> <image>` | Start container in background |
| | `docker stop <name>` | Stop a container |
| | `docker rm <name>` | Remove a container |
| | `docker logs <name>` | View container logs |
| | `docker network create <name>` | Create Docker network |
| **Elasticsearch** | `curl http://localhost:9200/_cluster/health` | Check cluster health |
| | `curl http://localhost:9200/_cat/indices?v` | List all indices |
| | `curl http://localhost:9200/<index>/_search?pretty` | Search documents |
| | `curl -X DELETE http://localhost:9200/<index>` | Delete an index |
| | `curl http://localhost:9200/<index>/_mapping?pretty` | View index mapping |
| **Logstash** | `curl http://localhost:9600/_node/stats?pretty` | View Logstash stats |
| **Filebeat** | `docker logs filebeat` | View Filebeat logs |
| **Query** | `GET /<index>/_search` with JSON body | Search with Query DSL |
| | `GET /<index>/_search?size=0&aggs=...` | Run aggregations |

---

## Best Practices

1. **Log Rotation**: Configure appropriate log rotation to prevent disk space issues
   - Use size-based rotation (e.g., 10MB per file)
   - Keep a reasonable number of backup files (5-10)

2. **Index Naming Conventions**: Use date-based index patterns (e.g., `logs-YYYY.MM.dd`)
   - Enables easy time-based queries
   - Simplifies retention policies
   - Improves query performance

3. **Resource Limits**: Set appropriate memory limits for containers
   - Elasticsearch: Minimum 512MB, recommended 2GB+ for production
   - Logstash: 512MB-1GB typically sufficient
   - Filebeat: Very lightweight, 100-200MB

4. **Security Considerations**: 
   - This workshop uses development setup (no authentication)
   - In production, enable Elasticsearch security features
   - Use TLS for inter-component communication
   - Implement proper access controls

5. **Monitoring**: 
   - Monitor Elasticsearch cluster health regularly
   - Set up alerts for disk space, memory usage
   - Monitor Logstash pipeline performance
   - Track Filebeat harvesting status

6. **Index Lifecycle Management**: 
   - Use Index Lifecycle Management (ILM) policies for automated retention
   - Define hot/warm/cold phases based on access patterns
   - Automate index deletion after retention period

7. **Query Optimization**: 
   - Use specific date ranges in queries to limit data scanned
   - Use keyword fields for exact matches (faster than text search)
   - Limit result size when possible
   - Use aggregations instead of retrieving all documents

8. **Error Handling**: 
   - Monitor Logstash for parsing errors
   - Check Filebeat logs for file access issues
   - Set up alerts for failed log shipping

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Elasticsearch not starting** | Check available memory: `docker stats elasticsearch`<br>Reduce heap size: `ES_JAVA_OPTS=-Xms256m -Xmx256m`<br>Check logs: `docker logs elasticsearch` |
| **Elasticsearch status is red** | Check for unassigned shards: `curl http://localhost:9200/_cat/shards?v`<br>For single-node, this is usually normal if replicas > 0 |
| **Logstash connection errors** | Verify Elasticsearch is running: `curl http://localhost:9200`<br>Check network: `docker network inspect elk-network`<br>Verify Logstash can reach Elasticsearch: `docker exec logstash ping elasticsearch` |
| **Filebeat not reading files** | Check file permissions: `ls -la polarh10-backend/logs/`<br>Verify volume mount: `docker exec filebeat ls -la /var/log/app/`<br>Check Filebeat logs: `docker logs filebeat` |
| **Logs not appearing in Elasticsearch** | Verify pipeline: Check Logstash logs for errors<br>Test Filebeat → Logstash: Check Filebeat logs for "published" messages<br>Test Logstash → Elasticsearch: Check Logstash logs for "indexed" messages<br>Wait a few seconds for processing |
| **Query returns no results** | Verify index exists: `curl http://localhost:9200/_cat/indices?v`<br>Check document count: `curl http://localhost:9200/<index>/_count`<br>Verify field names in mapping match query |
| **JSON parsing errors in Logstash** | Check log format matches expected JSON structure<br>Review Logstash filter configuration<br>Enable stdout output in Logstash for debugging |
| **Permission denied errors** | Ensure log files are readable: `chmod 644 polarh10-backend/logs/*.log`<br>Check Docker volume mount permissions |
| **Container port conflicts** | Check if ports are already in use: `lsof -i :9200`<br>Change port mappings in docker run commands |
| **Index template not applying** | Verify template pattern matches index name<br>Check template priority (higher priority wins)<br>Ensure template is created before index |

---

END LAB
