"""
Space Mission Tracker Dashboard - Flask Backend

This Flask application serves as the backend for the Space Mission Tracker.
It fetches data from the Launch Library 2 API and caches it to avoid rate limits.
"""

from flask import Flask, jsonify, render_template
import requests
from datetime import datetime, timedelta
import json
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
LAUNCH_LIBRARY_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/"
CACHE_FILE = "launch_cache.json"
CACHE_DURATION = timedelta(hours=1)  # Cache data for 1 hour


def load_cache():
    """
    Load cached launch data from file if it exists and is not expired.
    
    Returns:
        dict or None: Cached data if valid, None otherwise
    """
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r') as f:
            cache_data = json.load(f)
            # Check if cache is still valid (not expired)
            cache_time = datetime.fromisoformat(cache_data['timestamp'])
            if datetime.now() - cache_time < CACHE_DURATION:
                return cache_data['data']
    return None


def save_cache(data):
    """
    Save launch data to cache file with current timestamp.
    
    Args:
        data: Launch data to cache
    """
    cache_data = {
        'timestamp': datetime.now().isoformat(),
        'data': data
    }
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache_data, f)


def load_sample_data():
    """
    Load sample launch data from local file as fallback.
    
    Returns:
        dict: Sample launch data
    """
    try:
        with open('sample_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"error": "Sample data not found", "results": []}


def fetch_launch_data():
    """
    Fetch launch data from Launch Library 2 API or cache.
    Falls back to sample data if API is unavailable.
    
    Returns:
        dict: Launch data including upcoming launches
    """
    # Try to load from cache first
    cached_data = load_cache()
    if cached_data:
        print("Returning cached data")
        return cached_data
    
    # If no valid cache, fetch from API
    try:
        print("Fetching fresh data from API")
        response = requests.get(LAUNCH_LIBRARY_API_URL, timeout=10)
        response.raise_for_status()  # Raise error for bad status codes
        data = response.json()
        
        # Save to cache
        save_cache(data)
        return data
    except requests.RequestException as e:
        print(f"Error fetching data from API: {e}")
        print("Falling back to sample data")
        # Fall back to sample data if API is unavailable
        return load_sample_data()


@app.route('/')
def index():
    """
    Serve the main HTML page for the dashboard.
    """
    return render_template('index.html')


@app.route('/api/launches')
def get_launches():
    """
    API endpoint to get launch data.
    
    Returns:
        JSON response with launch data
    """
    data = fetch_launch_data()
    return jsonify(data)


# Run the Flask app
if __name__ == '__main__':
    # Run in debug mode for development (disable in production)
    app.run(debug=True, host='0.0.0.0', port=5000)
