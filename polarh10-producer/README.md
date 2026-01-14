# Polar H10 Heart Rate Monitor

A Python application for reading heart rate data from Polar H10 sensors via Bluetooth Low Energy (BLE). The app supports both normal mode (with actual sensor) and test mode (with simulated random data). It can send data to Google Cloud Pub/Sub for cloud integration or print to screen for local monitoring.

## Features

- **Real-time heart rate monitoring** from Polar H10 sensors
- **Test mode** for development and testing without a physical sensor
- **Google Cloud Pub/Sub integration** for sending data to cloud queues
- **Cross-platform support** (Windows, macOS, Linux)
- **Asynchronous BLE communication** using `bleak` and `bleakheart`
- **Callback-based architecture** for processing heart rate data
- **Graceful shutdown** via keyboard input

## Requirements

- Python 3.7 or higher
- Polar H10 heart rate sensor (for normal mode)
- Bluetooth adapter (for normal mode)
- Required Python packages:
  - `bleakheart` - Heart rate service implementation
- Optional Python packages (for Pub/Sub support):
  - `google-cloud-pubsub` - Google Cloud Pub/Sub client library

## Installation

1. Clone or download this repository

2. Install the required dependencies:

```bash
pip install bleakheart
```

3. (Optional) Install Google Cloud Pub/Sub support:

```bash
pip install google-cloud-pubsub
```

Note: The application works without Pub/Sub installed - it will simply print data to screen instead of publishing to Pub/Sub.

## Usage

### Normal Mode (with Polar H10 sensor)

Run the application without any flags to connect to a Polar H10 sensor:

```bash
python hr_callbacl.py
```

The app will:
1. Scan for nearby Polar devices
2. Connect to the first Polar H10 sensor found
3. Start receiving and printing heart rate data
4. Continue until you press Enter or the sensor disconnects

**Example output:**
```
Scanning for BLE devices
After connecting, will print heart rate data in the form
   ('HR', tstamp, (bpm, rr_interval), energy)
where tstamp is in ns, rr intervals are in ms, and
energy expenditure (if present) is in kJoule.
Connected: True
>>> Hit Enter to exit <<<
('HR', 1766417260747938000, (119, 521), None)
('HR', 1766417261738946000, (118, 520), None)
('HR', 1766417262192074000, (117, 515), None)
...
```

### Test Mode (without sensor)

Run the application with the `--test` flag to generate random heart rate data:

```bash
python hr_callbacl.py --test
```

This mode is useful for:
- Development and testing without a physical sensor
- Demonstrating the data format
- Testing your data processing logic

**Example output:**
```
Running in TEST MODE - generating random HR data
After starting, will print heart rate data in the form
   ('HR', tstamp, (bpm, rr_interval), energy)
where tstamp is in ns, rr intervals are in ms, and
energy expenditure (if present) is in kJoule.
>>> Running in TEST MODE - generating random HR data <<<
>>> Hit Enter to exit <<<
('HR', 1766417260747938000, (115, 650), None)
('HR', 1766417261738946000, (118, 520), None)
('HR', 1766417262192074000, (112, 580), None)
...
```

### Pub/Sub Mode (with Google Cloud Pub/Sub)

The application can send heart rate data directly to Google Cloud Pub/Sub instead of printing to screen. This is useful for cloud-based data processing and analytics.

**Prerequisites:**
- Google Cloud project with Pub/Sub enabled
- A Pub/Sub topic created in your project
- Authentication configured (see [Authentication](#authentication) section)

**Basic usage:**

```bash
python hr_callbacl.py \
  --pubsub-project-id YOUR_PROJECT_ID \
  --pubsub-topic-name YOUR_TOPIC_NAME
```

**With test mode:**

```bash
python hr_callbacl.py --test \
  --pubsub-project-id YOUR_PROJECT_ID \
  --pubsub-topic-name YOUR_TOPIC_NAME
```

**With explicit credentials file:**

```bash
python hr_callbacl.py \
  --pubsub-project-id YOUR_PROJECT_ID \
  --pubsub-topic-name YOUR_TOPIC_NAME \
  --pubsub-credentials-path /path/to/service-account-key.json
```

**Example output:**
```
No Pub/Sub configuration provided. Data will be printed to screen.
Initialized Pub/Sub publisher for topic: projects/YOUR_PROJECT_ID/topics/YOUR_TOPIC_NAME
Scanning for BLE devices
Connected: True
>>> Hit Enter to exit <<<
Published to Pub/Sub: ('HR', 1766417260747938000, (119, 521), None)
Published to Pub/Sub: ('HR', 1766417261738946000, (118, 520), None)
...
```

### Authentication

To use Google Cloud Pub/Sub, you need to authenticate. The application supports multiple authentication methods:

#### Option 1: Application Default Credentials (Recommended for local development)

If you have `gcloud` CLI installed, authenticate once:

```bash
gcloud auth application-default login
```

Then run the application normally - it will automatically use these credentials.

#### Option 2: Service Account Key File (Recommended for production)

1. Create a service account in Google Cloud Console:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Grant it the **Pub/Sub Publisher** role (`roles/pubsub.publisher`)

2. Create and download a JSON key:
   - Click on the service account → **Keys** → **Add Key** → **Create new key** (JSON)
   - Save the JSON file securely

3. Use it with the application:
   ```bash
   python hr_callbacl.py \
     --pubsub-project-id YOUR_PROJECT_ID \
     --pubsub-topic-name YOUR_TOPIC_NAME \
     --pubsub-credentials-path /path/to/service-account-key.json
   ```

#### Option 3: Environment Variable

Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
python hr_callbacl.py --pubsub-project-id YOUR_PROJECT_ID --pubsub-topic-name YOUR_TOPIC_NAME
```

**Note:** If authentication fails, the application will show helpful error messages and fall back to printing data to screen.

### Exiting the Application

Press **Enter** at any time to gracefully exit the application in all modes.

## Data Format

### Screen Output Format

When printing to screen, the heart rate data is provided in the following format:

```python
('HR', timestamp, (bpm, rr_interval), energy)
```

Where:
- **`'HR'`**: Data type identifier
- **`timestamp`**: Unix timestamp in nanoseconds
- **`bpm`**: Heart rate in beats per minute
- **`rr_interval`**: RR interval in milliseconds (time between consecutive heartbeats)
- **`energy`**: Energy expenditure in kilojoules (typically `None`)

### Example Data Tuple

```python
('HR', 1766417260747938000, (119, 521), None)
```

This represents:
- Timestamp: `1766417260747938000` nanoseconds
- Heart rate: `119` BPM
- RR interval: `521` milliseconds
- Energy: `None` (not available)

### Pub/Sub Message Format

When sending data to Pub/Sub, the data is serialized as JSON with the following structure:

```json
{
  "type": "HR",
  "timestamp": 1766417260747938000,
  "bpm": 119,
  "rr_interval": 521,
  "energy": null
}
```

The message is published as a UTF-8 encoded JSON string to the specified Pub/Sub topic.

## Configuration

You can modify the following parameters in `hr_callbacl.py`:

- **`UNPACK`**: Set to `True` to unpack RR intervals (default: `True`)
- **`INSTANT_RATE`**: Enable instant rate calculation (default: `False`, requires `UNPACK=True`)

## Troubleshooting

### Sensor Not Found

If the app cannot find a Polar H10 sensor:

1. Ensure the sensor is powered on and within Bluetooth range
2. Make sure Bluetooth is enabled on your computer
3. Check that the sensor is not connected to another device
4. Try running in test mode: `python hr_callbacl.py --test`

### Connection Issues

- **Windows**: May require additional Bluetooth drivers
- **Linux**: May require `bluetoothctl` permissions or `sudo` access
- **macOS**: Usually works out of the box

### Permission Errors

On Linux, you may need to grant Bluetooth permissions or run with appropriate privileges.

### Pub/Sub Authentication Errors

If you see authentication errors when using Pub/Sub:

1. **"Authentication failed"**: Make sure you've set up credentials using one of the methods described in the [Authentication](#authentication) section
2. **"Permission denied"**: Ensure your service account has the `roles/pubsub.publisher` role
3. **"Topic not found"**: Verify that the topic exists in your Google Cloud project and the name is correct
4. **"Project not found"**: Check that the project ID is correct and you have access to it

If authentication fails, the application will automatically fall back to printing data to screen.

## Customization

### Pub/Sub Integration

The application already includes Pub/Sub integration. Simply provide the `--pubsub-project-id` and `--pubsub-topic-name` arguments to enable it. The `heartrate_callback()` function automatically handles:
- Converting data to JSON format
- Publishing to Pub/Sub topic
- Error handling and fallback to screen output

### Modifying the Callback Function

The `heartrate_callback()` function in `hr_callbacl.py` processes the heart rate data. By default, it:
- Sends data to Pub/Sub if configured
- Prints data to screen otherwise

You can modify this function to add additional processing:

```python
def heartrate_callback(data):
    """Custom callback to process HR data"""
    hr_type, timestamp, hr_data, energy = data
    bpm, rr_interval = hr_data if isinstance(hr_data, tuple) else (hr_data[0], hr_data)
    
    # Your custom processing here
    if bpm > 120:
        print(f"Warning: High heart rate detected: {bpm} BPM")
    
    # The function will automatically handle Pub/Sub or screen output
    # based on configuration
```

### Using Different Devices

To use a different BLE heart rate device, modify the `scan()` function:

```python
async def scan():
    device = await BleakScanner.find_device_by_filter(
        lambda dev, adv: dev.name and "your_device_name" in dev.name.lower())
    return device
```

## Platform-Specific Notes

### Windows

- Uses threading for keyboard input handling (due to asyncio limitations)
- May require additional Bluetooth drivers

### macOS/Linux

- Uses `asyncio.add_reader()` for efficient keyboard input handling
- Generally better BLE support

## License

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

Copyright (C) 2023 Fabrizio Smeraldi <fabrizio@smeraldi.net>

## Command-Line Arguments

| Argument | Description |
|----------|-------------|
| `--test` | Run in test mode with random data generation (no sensor required) |
| `--pubsub-project-id` | Google Cloud project ID for Pub/Sub (required with `--pubsub-topic-name`) |
| `--pubsub-topic-name` | Pub/Sub topic name (required with `--pubsub-project-id`) |
| `--pubsub-credentials-path` | Path to service account JSON key file (optional, uses ADC if not provided) |

**Note:** Both `--pubsub-project-id` and `--pubsub-topic-name` must be provided together, or neither should be provided (for screen output mode).

## Acknowledgments

- Original code by Fabrizio Smeraldi
- Uses `bleak` for BLE communication
- Uses `bleakheart` for heart rate service implementation
- Google Cloud Pub/Sub integration added for cloud data streaming

