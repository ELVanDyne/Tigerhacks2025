# 🚀 Space Mission Tracker Dashboard

A beginner-friendly web application that displays upcoming and recent space launches using the Launch Library 2 API. This project demonstrates how to build a full-stack web application with a Python Flask backend and a modern HTML/CSS/JavaScript frontend.

## 📋 Features

- **Real-time Launch Data**: Displays upcoming space launches from around the world
- **Smart Caching**: Caches API data for 1 hour to avoid rate limits
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Clean Code**: Well-commented code perfect for beginners to learn from
- **Simple Architecture**: Easy-to-understand file structure

## 🗂️ Project Structure

```
Tigerhacks2025/
├── app.py                      # Flask backend application
├── requirements.txt            # Python dependencies
├── templates/
│   └── index.html             # Main HTML page
├── static/
│   ├── css/
│   │   └── style.css          # Stylesheet
│   └── js/
│       └── app.js             # Frontend JavaScript
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ELVanDyne/Tigerhacks2025.git
   cd Tigerhacks2025
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Open your web browser**
   
   Navigate to: `http://localhost:5000`

3. **View the dashboard**
   
   You should see a beautiful dashboard displaying upcoming space launches!

## 🎓 How It Works

### Backend (app.py)

The Flask backend does three main things:

1. **Fetches Data**: Retrieves launch information from the Launch Library 2 API
2. **Caches Data**: Saves the data locally for 1 hour to avoid hitting rate limits
3. **Serves API**: Provides a `/api/launches` endpoint for the frontend to fetch data

### Frontend

- **index.html**: The main page structure with semantic HTML
- **style.css**: Beautiful, responsive styling with a purple gradient theme
- **app.js**: Fetches data from the backend and dynamically creates launch cards

## 🔧 Customization

### Change Cache Duration

In `app.py`, modify the `CACHE_DURATION` variable:
```python
CACHE_DURATION = timedelta(hours=2)  # Cache for 2 hours instead
```

### Modify Styling

Edit `static/css/style.css` to change colors, fonts, or layout. For example, to change the main color scheme:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adjust Number of Launches

The API returns 10 launches by default. To get more, modify the URL in `app.py`:
```python
LAUNCH_LIBRARY_API_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=20"
```

## 📚 Learning Resources

This project is perfect for learning:

- **Flask**: Python web framework basics
- **REST APIs**: How to fetch and use external APIs
- **Caching**: Implementing simple file-based caching
- **Async JavaScript**: Using `fetch()` and Promises
- **DOM Manipulation**: Creating dynamic HTML with JavaScript
- **Responsive Design**: CSS Grid and mobile-first design

## 🌐 API Information

This project uses the [Launch Library 2 API](https://thespacedevs.com/llapi) by The Space Devs. It's a free API that provides comprehensive information about space launches.

## 🤝 Contributing

This is a beginner-friendly project! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- Launch data provided by [The Space Devs](https://thespacedevs.com/)
- Built for Tigerhacks 2025

## 💡 Tips for Beginners

1. **Start by reading the code comments**: Each file has detailed comments explaining what the code does
2. **Experiment**: Try changing colors, text, or the number of launches displayed
3. **Use browser DevTools**: Press F12 in your browser to see console logs and inspect elements
4. **Check the cache file**: After running the app, look at `launch_cache.json` to see the cached data

## 🐛 Troubleshooting

**Issue**: `ModuleNotFoundError: No module named 'flask'`
- **Solution**: Run `pip install -r requirements.txt`

**Issue**: Port 5000 already in use
- **Solution**: Change the port in `app.py`: `app.run(debug=True, port=5001)`

**Issue**: No launches showing up
- **Solution**: Check your internet connection and the browser console (F12) for errors
