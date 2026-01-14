#!/bin/bash
set -e

# Check required environment variables
if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID environment variable is not set"
    exit 1
fi

if [ -z "$SUBSCRIPTION_NAME" ]; then
    echo "Error: SUBSCRIPTION_NAME environment variable is not set"
    exit 1
fi

# Download service account key from public URL if GCS_KEY_FILE_URL is provided
if [ ! -z "$GCS_KEY_FILE_URL" ]; then
    echo "Downloading service account key from: $GCS_KEY_FILE_URL"
    KEY_FILE_PATH="/tmp/service-account-key.json"
    
    # Download using wget
    wget -q -O "$KEY_FILE_PATH" "$GCS_KEY_FILE_URL"
    
    # Verify the file was downloaded
    if [ ! -f "$KEY_FILE_PATH" ]; then
        echo "Error: Failed to download key file from $GCS_KEY_FILE_URL"
        exit 1
    fi
    
    # Set the credentials path for Google Application Default Credentials
    export GOOGLE_APPLICATION_CREDENTIALS="$KEY_FILE_PATH"
    echo "Service account key downloaded to $KEY_FILE_PATH"
    echo "Using credentials from: $GOOGLE_APPLICATION_CREDENTIALS"
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Start Django server in background
echo "Starting Django server on 0.0.0.0:8000..."
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Start Pub/Sub subscriber
echo "Starting Pub/Sub subscriber..."
echo "  Project ID: $PROJECT_ID"
echo "  Subscription: $SUBSCRIPTION_NAME"
python manage.py subscribe_hr --project-id "$PROJECT_ID" --subscription-name "$SUBSCRIPTION_NAME" &
SUBSCRIBER_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down..."
    kill $DJANGO_PID $SUBSCRIBER_PID 2>/dev/null || true
    wait $DJANGO_PID $SUBSCRIBER_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $DJANGO_PID $SUBSCRIBER_PID

