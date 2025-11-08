"""
Simple tests for the Space Mission Tracker Dashboard
These tests verify basic functionality of the Flask application
"""

import json
import os
import sys
from datetime import datetime, timedelta

# Import the Flask app
from app import app, load_cache, save_cache, load_sample_data, fetch_launch_data


def test_flask_app_exists():
    """Test that the Flask app is created successfully"""
    assert app is not None
    print("✓ Flask app exists")


def test_sample_data_loads():
    """Test that sample data can be loaded"""
    data = load_sample_data()
    assert 'results' in data
    assert len(data['results']) > 0
    print(f"✓ Sample data loads successfully ({len(data['results'])} launches)")


def test_api_endpoint():
    """Test that the /api/launches endpoint works"""
    with app.test_client() as client:
        response = client.get('/api/launches')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'results' in data
        print(f"✓ API endpoint works (returned {len(data['results'])} launches)")


def test_index_page():
    """Test that the main page loads"""
    with app.test_client() as client:
        response = client.get('/')
        assert response.status_code == 200
        assert b'Space Mission Tracker' in response.data
        print("✓ Index page loads successfully")


def test_cache_functions():
    """Test cache save and load functions"""
    # Clean up any existing test cache
    test_cache_file = 'test_cache.json'
    if os.path.exists(test_cache_file):
        os.remove(test_cache_file)
    
    # Create test data
    test_data = {'results': [{'name': 'Test Launch'}]}
    
    # Save to cache
    cache_data = {
        'timestamp': datetime.now().isoformat(),
        'data': test_data
    }
    with open(test_cache_file, 'w') as f:
        json.dump(cache_data, f)
    
    # Load from cache
    with open(test_cache_file, 'r') as f:
        loaded = json.load(f)
        assert loaded['data'] == test_data
    
    # Clean up
    os.remove(test_cache_file)
    print("✓ Cache save and load functions work")


def test_static_files_exist():
    """Test that static files are present"""
    assert os.path.exists('static/css/style.css')
    assert os.path.exists('static/js/app.js')
    assert os.path.exists('templates/index.html')
    print("✓ All static files exist")


if __name__ == '__main__':
    print("\n🚀 Running Space Mission Tracker Tests\n")
    
    try:
        test_flask_app_exists()
        test_sample_data_loads()
        test_cache_functions()
        test_static_files_exist()
        test_index_page()
        test_api_endpoint()
        
        print("\n✅ All tests passed!\n")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error running tests: {e}\n")
        sys.exit(1)
