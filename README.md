# Space Mission Tracker Dashboard

A web application that displays upcoming and recent space launches using the Launch Library 2 API. This project demonstrates how to build a full-stack web application with a Python Flask backend and a modern HTML/CSS/JavaScript frontend.

## Features

- **Real-time Launch Data**: Displays upcoming space launches worldwide
- **Caching**: Caches API data to avoid rate limits

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ELVanDyne/Tigerhacks2025.git
    cd Tigerhacks2025
    ```

2.  **Create and activate a virtual environment** (recommended)
    ```bash
    # Create a venv in the project root
    python3 -m venv .venv

    # Activate the venv (Linux/macOS)
    source .venv/bin/activate
    
    ```

3.  **Install Python dependencies**
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1. **Start the Flask server**
   ```bash (venv)
   python app.py
   ```

2. **Open your web browser**
   
   Navigate to: `http://localhost:5000`


## How It Works

### Backend (app.py)

The Flask backend does three main things:

1. **Fetches Data**: Retrieves launch information from the Launch Library 2 API
2. **Caches Data**: Saves the data locally for 1 hour to avoid hitting rate limits
3. **Serves API**: Provides a `/api/launches` endpoint for the frontend to fetch data

## Customization

### Change Cache Duration

In `app.py`, modify the `CACHE_DURATION` variable:
```python
CACHE_DURATION = timedelta(minutes=120)  # Cache for 2 hours instead
```

### Adjust Number of Launches

The API returns 10 launches by default. To get more, modify the URL in `app.py`:
```python
LAUNCH_LIBRARY_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=18"
```

## API Information

This project uses the [Launch Library 2 API](https://thespacedevs.com/llapi) by The Space Devs. It's a free API that provides comprehensive information about space launches.

We are mainly using the developer version, which is not updated as frequently but allows unlimited anonymous calls.
## Acknowledgments

- Launch data provided by [The Space Devs](https://thespacedevs.com/)
- Built for Tigerhacks 2025

## Troubleshooting

**Issue**: `ModuleNotFoundError: No module named 'flask'`
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: Port 5000 already in use
- **Solution**: Change the port in `app.py`: `app.run(debug=True, port=5001)`

**Issue**: No launches showing up
- **Solution**: Check your internet connection and the browser console (F12) for errors



