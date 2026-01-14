# Polar H10 Backend

Django backend for receiving heart rate data from Google Cloud Pub/Sub and exposing it via REST API.

## Setup

```bash
cd polarh10-backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
```

## Running

**Start Django server:**
```bash
python manage.py runserver
```

**Start Pub/Sub subscriber (separate terminal):**
```bash
python manage.py subscribe_hr --project-id YOUR_PROJECT_ID --subscription-name YOUR_SUBSCRIPTION --credentials-path YOUR_CREDENTIALS_PATH
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/heartrate/` | List all readings (paginated) |
| `GET /api/heartrate/?minutes=5` | Get readings from last N minutes |
| `GET /api/heartrate/{id}/` | Get single reading |
| `GET /api/heartrate/latest/` | Get most recent reading |
| `GET /api/heartrate/stats/` | Get aggregated statistics |

## Message Format

The subscriber expects messages in JSON format:
```json
{
    "type": "HR",
    "timestamp": 1766417260747938000,
    "bpm": 119,
    "rr_interval": 521,
    "energy": null
}
```
