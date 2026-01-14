# Polar H10 Frontend

A real-time heart rate monitoring dashboard built with Next.js 15, TypeScript, and Tailwind CSS. Displays live data from the Polar H10 sensor via the Django backend API.

## Features

- 📊 **Real-time Chart** - Live heart rate visualization with Recharts
- ❤️ **Live BPM Display** - Current heart rate with zone indicators (Resting, Normal, Moderate, Vigorous, Maximum)
- 📈 **Statistics** - Average, min, max BPM and reading counts
- 📋 **Recent Readings Table** - Scrollable list of recent measurements
- ⏱️ **Time Range Selection** - View data from last 1, 5, 15, or 30 minutes
- 🔄 **Auto-refresh** - Updates every second
- 🌙 **Dark Theme** - Modern dark UI with accent colors

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Running Django backend (`polarh10-backend`)

## Quick Start

### 1. Install dependencies

```bash
cd polarh10-frontend
npm install
```

### 2. Configure environment (optional)

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if your backend runs on a different URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running the Full Stack

To see live data, you need all three components running:

### Terminal 1: Django Backend
```bash
cd polarh10-backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
python manage.py runserver
```

### Terminal 2: Pub/Sub Subscriber (if using GCP)
```bash
cd polarh10-backend
venv\Scripts\activate
python manage.py subscribe_hr --project-id YOUR_PROJECT_ID --subscription-name YOUR_SUBSCRIPTION
```

### Terminal 3: Heart Rate Producer
```bash
cd polarh10-producer
python hr_callbacl.py --test  # Test mode (no sensor needed)
# or
python hr_callbacl.py  # Real Polar H10 sensor
```

### Terminal 4: Next.js Frontend
```bash
cd polarh10-frontend
npm run dev
```

## Project Structure

```
polarh10-frontend/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles & CSS variables
│   │   ├── layout.tsx       # Root layout with fonts
│   │   └── page.tsx         # Main dashboard page
│   ├── components/
│   │   ├── HeartRateChart.tsx    # Recharts area chart
│   │   ├── LatestReading.tsx     # Current BPM display
│   │   ├── StatsCard.tsx         # Statistics card
│   │   ├── ConnectionStatus.tsx  # Connection indicator
│   │   ├── ReadingsTable.tsx     # Recent readings table
│   │   └── index.ts              # Component exports
│   ├── hooks/
│   │   └── useHeartRate.ts       # Data fetching hook
│   └── lib/
│       └── api.ts                # API client
├── .env.local.example
├── package.json
└── README.md
```

## API Endpoints Used

The frontend consumes these Django REST API endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /api/heartrate/` | List readings (with `?minutes=N` filter) |
| `GET /api/heartrate/latest/` | Get most recent reading |
| `GET /api/heartrate/stats/` | Get aggregated statistics |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Django backend URL |

### Customization

- **Refresh interval**: Edit `refreshInterval` in `src/app/page.tsx` (default: 1000ms)
- **Time ranges**: Edit `TIME_RANGES` array in `src/app/page.tsx`
- **Colors**: Edit CSS variables in `src/app/globals.css`

## Development

```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```
