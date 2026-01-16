"""
Django management command to subscribe to Pub/Sub and save HR data to database.

Usage:
    python manage.py subscribe_hr --project-id YOUR_PROJECT_ID --subscription-name YOUR_SUBSCRIPTION_NAME

Or with environment variables:
    export PUBSUB_PROJECT_ID=your-project-id
    export PUBSUB_SUBSCRIPTION_NAME=your-subscription-name
    python manage.py subscribe_hr
"""

import json
import signal
import sys
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone

# Google Cloud Pub/Sub imports
try:
    from google.cloud import pubsub_v1
    from google.api_core.exceptions import NotFound, PermissionDenied
    PUBSUB_AVAILABLE = True
except ImportError:
    PUBSUB_AVAILABLE = False

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Subscribe to Google Cloud Pub/Sub and save heart rate data to database'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.subscriber = None
        self.streaming_pull_future = None
        self.running = True

    def add_arguments(self, parser):
        parser.add_argument(
            '--project-id',
            type=str,
            help='Google Cloud project ID (or set PUBSUB_PROJECT_ID env var)',
        )
        parser.add_argument(
            '--subscription-name',
            type=str,
            help='Pub/Sub subscription name (or set PUBSUB_SUBSCRIPTION_NAME env var)',
        )
        parser.add_argument(
            '--credentials-path',
            type=str,
            help='Path to service account JSON key file (optional)',
        )
        parser.add_argument(
            '--timeout',
            type=int,
            default=None,
            help='Timeout in seconds (default: run indefinitely)',
        )

    def handle(self, *args, **options):
        if not PUBSUB_AVAILABLE:
            raise CommandError(
                'google-cloud-pubsub is not installed. '
                'Install it with: pip install google-cloud-pubsub'
            )

        # Get configuration from arguments or settings/environment
        project_id = options['project_id'] or settings.PUBSUB_PROJECT_ID
        subscription_name = options['subscription_name'] or settings.PUBSUB_SUBSCRIPTION_NAME
        credentials_path = options['credentials_path'] or settings.PUBSUB_CREDENTIALS_PATH
        timeout = options['timeout']

        if not project_id:
            raise CommandError(
                'Project ID is required. Use --project-id or set PUBSUB_PROJECT_ID env var'
            )
        if not subscription_name:
            raise CommandError(
                'Subscription name is required. Use --subscription-name or set PUBSUB_SUBSCRIPTION_NAME env var'
            )

        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        self.stdout.write(self.style.SUCCESS(
            f'Starting Pub/Sub subscriber...\n'
            f'  Project ID: {project_id}\n'
            f'  Subscription: {subscription_name}'
        ))

        try:
            self.run_subscriber(project_id, subscription_name, credentials_path, timeout)
        except NotFound as e:
            raise CommandError(f'Subscription not found: {e}')
        except PermissionDenied as e:
            raise CommandError(f'Permission denied: {e}')
        except Exception as e:
            raise CommandError(f'Error: {e}')

    def signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        self.stdout.write(self.style.WARNING('\nReceived shutdown signal. Stopping...'))
        self.running = False
        if self.streaming_pull_future:
            self.streaming_pull_future.cancel()

    def run_subscriber(self, project_id, subscription_name, credentials_path, timeout):
        """Run the Pub/Sub subscriber."""
        import os
        
        # Set credentials if provided
        if credentials_path:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
            self.stdout.write(f'Using credentials from: {credentials_path}')

        # Create subscriber client
        self.subscriber = pubsub_v1.SubscriberClient()
        subscription_path = self.subscriber.subscription_path(project_id, subscription_name)

        self.stdout.write(self.style.SUCCESS(
            f'Listening for messages on {subscription_path}...\n'
            f'Press Ctrl+C to stop.'
        ))

        # Start streaming pull
        self.streaming_pull_future = self.subscriber.subscribe(
            subscription_path,
            callback=self.message_callback,
        )

        try:
            # Block until timeout or signal
            self.streaming_pull_future.result(timeout=timeout)
        except Exception as e:
            if self.running:
                self.stdout.write(self.style.ERROR(f'Subscriber error: {e}'))
            self.streaming_pull_future.cancel()
            self.streaming_pull_future.result()  # Wait for cleanup

        self.stdout.write(self.style.SUCCESS('Subscriber stopped.'))

    def message_callback(self, message):
        """
        Callback function to process incoming Pub/Sub messages.
        
        Expected message format (JSON):
        {
            "type": "HR",
            "timestamp": 1766417260747938000,
            "bpm": 119,
            "rr_interval": 521,
            "energy": null
        }
        """
        from heartrate.models import HeartRateReading
        
        try:
            # Decode message data
            data = json.loads(message.data.decode('utf-8'))
            
            # Validate message type
            if data.get('type') != 'HR':
                self.stdout.write(self.style.WARNING(
                    f'Ignoring non-HR message: {data.get("type")}'
                ))
                message.ack()
                return

            # Extract fields
            sensor_timestamp = data.get('timestamp')
            bpm = data.get('bpm')
            if bpm is not None:
                bpm = int(bpm)
            rr_interval = data.get('rr_interval')
            energy = data.get('energy')

            # Handle rr_interval that might be a list
            if isinstance(rr_interval, list):
                rr_interval = rr_interval[0] if rr_interval else 0
            # Convert to integer if not None
            if rr_interval is not None:
                rr_interval = int(rr_interval)

            # Validate required fields
            if sensor_timestamp is None or bpm is None:
                self.stdout.write(self.style.ERROR(
                    f'Invalid message - missing required fields: {data}'
                ))
                message.ack()
                return

            # Create database record
            reading = HeartRateReading.objects.create(
                sensor_timestamp=sensor_timestamp,
                bpm=bpm,
                rr_interval=rr_interval or 0,
                energy=energy,
            )

            self.stdout.write(
                f'Saved: {reading.bpm} BPM, RR: {reading.rr_interval}ms '
                f'(ID: {reading.id})'
            )
            logger.debug({
                'message': 'HR data',
                'type': 'HR',
                'timestamp': sensor_timestamp,
                'bpm': bpm,
                'rr_interval': rr_interval
            })

            # Acknowledge the message
            message.ack()

        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(
                f'Failed to decode JSON: {e}\nRaw data: {message.data}'
            ))
            message.ack()  # Ack to prevent redelivery of malformed messages
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error processing message: {e}'))
            message.nack()  # Nack to retry later


