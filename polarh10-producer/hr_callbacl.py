""" 
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.

Copyright (C) 2023 Fabrizio Smeraldi <fabrizio@smeraldi.net>
"""

""" Heart rate acquisition using a callback function """

import sys
import os
import asyncio
import argparse
import random
import time
import json
from bleak import BleakScanner, BleakClient
from bleakheart import HeartRate

# Google Cloud Pub/Sub imports (optional)
try:
    from google.cloud import pubsub_v1
    from google.auth.exceptions import DefaultCredentialsError
    PUBSUB_AVAILABLE = True
except ImportError:
    PUBSUB_AVAILABLE = False
    DefaultCredentialsError = Exception

# Due to asyncio limitations on Windows, one cannot use loop.add_reader
# to handle keyboard input; we use threading instead. See
# https://docs.python.org/3.11/library/asyncio-platforms.html
if sys.platform=="win32":
    from threading import Thread
    add_reader_support=False
else:
    add_reader_support=True

# change these two parameters and see what happens.
# INSTANT_RATE is unsupported when UNPACK is False
UNPACK = True
INSTANT_RATE= UNPACK and False

# Global Pub/Sub publisher (initialized if Pub/Sub config is provided)
pubsub_publisher = None
pubsub_topic_path = None


async def scan():
    """ Scan for a Polar device. If you have another compatible device,
    edit the string in the code below accordingly """
    device= await BleakScanner.find_device_by_filter(
        lambda dev, adv: dev.name and "polar" in dev.name.lower())
    return device


async def run_ble_client(device, hr_callback):
    """ This task connects to the sensor, starts heart rate notification
    and monitors connection and stdio for disconnects/user input. """

    def keyboard_handler(loop=None):
        """ Called by the asyncio loop when the user hits Enter, 
        or run in a separate thread (if no add_reader support). In 
        this case, the event loop is passed as an argument """
        input() # clear input buffer
        print (f"Quitting on user command")
        # causes the client task to exit
        if loop==None:
            quitclient.set() # we are in the event loop thread
        else:
            # we are in a separate thread - call set in the event loop thread
            loop.call_soon_threadsafe(quitclient.set)

    def disconnected_callback(client):
        """ Called by BleakClient if the sensor disconnects """
        print("Sensor disconnected")
        # signal exit
        quitclient.set() # causes the client task to exit

    # we use this event to signal the end of the client task
    quitclient=asyncio.Event()
    # the context manager will handle connection/disconnection for us
    async with BleakClient(device, disconnected_callback=
                           disconnected_callback) as client:
        print(f"Connected: {client.is_connected}")
        loop=asyncio.get_running_loop()
        if add_reader_support:
            # Set the loop to call keyboard_handler when one line of input is
            # ready on stdin
            loop.add_reader(sys.stdin, keyboard_handler)
        else:
            # run keyboard_handler in a daemon thread
            Thread(target=keyboard_handler, kwargs={'loop': loop},
                   daemon=True).start()
        print(">>> Hit Enter to exit <<<")
        # create the heart rate object; set callback and other
        # parameters
        heartrate = HeartRate(client, callback=hr_callback,
                            instant_rate=INSTANT_RATE,
                            unpack=UNPACK)
        # start notifications; bleakheart will start sending data to
        # the callback
        await heartrate.start_notify()
        # this task does not need to do anything else; wait until
        # user hits enter or the sensor disconnects
        await quitclient.wait()
        # no need to stop notifications if we are exiting the context
        # manager anyway, as they will disconnect the client; however,
        # it's easy to stop them if we want to
        if client.is_connected:
            await heartrate.stop_notify()
        if add_reader_support:
            loop.remove_reader(sys.stdin)


def heartrate_callback(data):
    """ This callback is sent the heart rate data and does all the 
    processing. You should ensure it returns before the next 
    frame is received from the sensor. 

    If Pub/Sub is configured, sends data to Pub/Sub topic.
    Otherwise, prints decoded heart rate data to screen.
    """
    if pubsub_publisher is not None and pubsub_topic_path is not None:
        # Send to Pub/Sub
        try:
            # Convert data tuple to dictionary for JSON serialization
            hr_type, timestamp, hr_data, energy = data
            bpm, rr_interval = hr_data if isinstance(hr_data, tuple) else (hr_data[0], hr_data)
            
            message_data = {
                'type': hr_type,
                'timestamp': timestamp,
                'bpm': bpm,
                'rr_interval': rr_interval if isinstance(rr_interval, (int, float)) else list(rr_interval),
                'energy': energy
            }
            
            # Publish message to Pub/Sub
            # Note: We don't wait for the future to complete to avoid blocking
            # The message will be published asynchronously
            _ = pubsub_publisher.publish(
                pubsub_topic_path,
                json.dumps(message_data).encode('utf-8')
            )
            print(f"Published to Pub/Sub: {data}")
        except Exception as e:
            print(f"Error publishing to Pub/Sub: {e}")
            print(f"Data: {data}")
    else:
        # Print to screen (original behavior)
        print(data)


def generate_random_hr_data():
    """ Generate random HR data in the same format as Polar H10 sensor.
    Returns: ('HR', tstamp, (bpm, rr_interval), energy)
    """
    # Generate timestamp in nanoseconds (current time)
    tstamp = int(time.time_ns())
    
    # Generate realistic BPM (heart rate) - typically 60-120 for resting, 
    # but can vary. Using 100-120 range based on sample data
    bpm = random.randint(100, 120)
    
    # Generate RR interval in milliseconds
    # RR interval is inversely related to heart rate
    # For bpm 100-120, RR interval is typically 500-600ms
    # But sample data shows 500-900ms range, so we'll use that
    rr_interval = random.randint(500, 900)
    
    # Energy is None in sample data
    energy = None
    
    return ('HR', tstamp, (bpm, rr_interval), energy)


async def run_test_mode(hr_callback):
    """ Run the app in test mode, generating random HR data.
    Simulates the sensor behavior by calling the callback at regular intervals.
    """
    def keyboard_handler(loop=None):
        """ Called by the asyncio loop when the user hits Enter, 
        or run in a separate thread (if no add_reader support). """
        input() # clear input buffer
        print("Quitting on user command")
        if loop is None:
            quittest.set()
        else:
            loop.call_soon_threadsafe(quittest.set)
    
    quittest = asyncio.Event()
    loop = asyncio.get_running_loop()
    
    if add_reader_support:
        loop.add_reader(sys.stdin, keyboard_handler)
    else:
        Thread(target=keyboard_handler, kwargs={'loop': loop},
               daemon=True).start()
    
    print(">>> Running in TEST MODE - generating random HR data <<<")
    print(">>> Hit Enter to exit <<<")
    
    # Generate data at regular intervals (approximately every 100-200ms to simulate sensor)
    while not quittest.is_set():
        data = generate_random_hr_data()
        hr_callback(data)
        # Wait a random interval between 50-200ms to simulate real sensor timing
        await asyncio.sleep(random.uniform(0.05, 0.2))
    
    if add_reader_support:
        loop.remove_reader(sys.stdin)

        
def init_pubsub(project_id, topic_name, credentials_path=None):
    """ Initialize Google Cloud Pub/Sub publisher.
    
    Args:
        project_id: Google Cloud project ID
        topic_name: Name of the Pub/Sub topic
        credentials_path: Optional path to service account JSON key file.
                         If not provided, uses Application Default Credentials.
        
    Returns:
        tuple: (publisher, topic_path) or (None, None) if initialization fails
    """
    global pubsub_publisher, pubsub_topic_path
    
    if not PUBSUB_AVAILABLE:
        print("Warning: google-cloud-pubsub is not installed. Install it with: pip install google-cloud-pubsub")
        return None, None
    
    try:
        # Set credentials if provided
        if credentials_path:
            if not os.path.exists(credentials_path):
                print(f"Error: Credentials file not found: {credentials_path}")
                return None, None
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
            print(f"Using credentials from: {credentials_path}")
        
        # Initialize publisher (will use Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS)
        publisher = pubsub_v1.PublisherClient()
        topic_path = publisher.topic_path(project_id, topic_name)
        
        print(f"Initialized Pub/Sub publisher for topic: {topic_path}")
        return publisher, topic_path
    except DefaultCredentialsError as e:
        print("Error: Authentication failed. Please set up Google Cloud credentials.")
        print("Options:")
        print("  1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file")
        print("  2. Use 'gcloud auth application-default login' to set up Application Default Credentials")
        print("  3. Use --pubsub-credentials-path argument to specify credentials file")
        print(f"   Error details: {e}")
        return None, None
    except Exception as e:
        print(f"Error initializing Pub/Sub: {e}")
        return None, None


async def main(test_mode=False, pubsub_project_id=None, pubsub_topic_name=None, pubsub_credentials_path=None):
    """ Main function that supports both normal and test modes.
    
    Args:
        test_mode: If True, run in test mode with random data generation.
                   If False, try to connect to actual Polar H10 sensor.
        pubsub_project_id: Google Cloud project ID for Pub/Sub (optional)
        pubsub_topic_name: Pub/Sub topic name (optional)
        pubsub_credentials_path: Path to service account JSON key file (optional)
    """
    global pubsub_publisher, pubsub_topic_path
    
    # Initialize Pub/Sub if configuration is provided
    if pubsub_project_id and pubsub_topic_name:
        pubsub_publisher, pubsub_topic_path = init_pubsub(
            pubsub_project_id, 
            pubsub_topic_name,
            credentials_path=pubsub_credentials_path
        )
        if pubsub_publisher is None:
            print("Warning: Failed to initialize Pub/Sub. Falling back to printing to screen.")
    else:
        print("No Pub/Sub configuration provided. Data will be printed to screen.")
    if test_mode:
        print("Running in TEST MODE - generating random HR data")
        print("After starting, will print heart rate data in the form")
        print("   ('HR', tstamp, (bpm, rr_interval), energy)")
        print("where tstamp is in ns, rr intervals are in ms, and")
        print("energy expenditure (if present) is in kJoule.")
        await run_test_mode(heartrate_callback)
    else:
        print("Scanning for BLE devices")
        device = await scan()
        if device is None:
            print("Polar device not found. If you have another compatible")
            print("device, edit the scan() function accordingly.")
            print("\nTo run in test mode with random data, use: --test")
            sys.exit(-4)
        print("After connecting, will print heart rate data in the form")
        if UNPACK:
            print("   ('HR', tstamp, (bpm, rr_interval), energy)")
        else:
            print("   ('HR', tstamp, (bpm, [rr1,rr2,...]), energy)")
        print("where tstamp is in ns, rr intervals are in ms, and")
        print("energy expenditure (if present) is in kJoule.")
        # client task will return when the user hits enter or the
        # sensor disconnects
        await run_ble_client(device, heartrate_callback)
    print("Bye.")


# execute the main coroutine
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Heart rate acquisition from Polar H10 sensor or test mode with random data"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode with random data generation (no sensor required)"
    )
    parser.add_argument(
        "--pubsub-project-id",
        type=str,
        help="Google Cloud project ID for Pub/Sub (optional)"
    )
    parser.add_argument(
        "--pubsub-topic-name",
        type=str,
        help="Pub/Sub topic name (optional)"
    )
    parser.add_argument(
        "--pubsub-credentials-path",
        type=str,
        help="Path to Google Cloud service account JSON key file (optional). "
             "If not provided, uses Application Default Credentials or GOOGLE_APPLICATION_CREDENTIALS env var."
    )
    args = parser.parse_args()
    
    # Both Pub/Sub arguments must be provided together
    if (args.pubsub_project_id and not args.pubsub_topic_name) or \
       (args.pubsub_topic_name and not args.pubsub_project_id):
        print("Error: Both --pubsub-project-id and --pubsub-topic-name must be provided together.")
        sys.exit(1)
    
    asyncio.run(main(
        test_mode=args.test,
        pubsub_project_id=args.pubsub_project_id,
        pubsub_topic_name=args.pubsub_topic_name,
        pubsub_credentials_path=args.pubsub_credentials_path
    ))
