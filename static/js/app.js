/**
 * Space Mission Tracker - JavaScript
 * This file handles fetching launch data from our Flask backend
 * and displaying it on the page
 */

// Wait for the page to fully load before running our code
document.addEventListener('DOMContentLoaded', function() {
    // Get references to important elements on the page
    const launchesContainer = document.getElementById('launches-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const lastUpdateElement = document.getElementById('last-update');

    /**
     * Format a date string into a more readable format
     * @param {string} dateString - ISO date string from the API
     * @returns {string} Formatted date string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            timeZoneName: 'short'
        };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Get a CSS class based on launch status
     * @param {string} status - Status name from API
     * @returns {string} CSS class name
     */
    function getStatusClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('go')) {
            return 'status-go';
        } else if (statusLower.includes('tbd') || statusLower.includes('to be')) {
            return 'status-tbd';
        } else {
            return 'status-hold';
        }
    }

    /**
     * Create HTML for a single launch card
     * @param {object} launch - Launch data object from API
     * @returns {string} HTML string for the launch card
     */
    function createLaunchCard(launch) {
        // Get launch details with fallback values if data is missing
        const name = launch.name || 'Unknown Mission';
        const status = launch.status?.name || 'Unknown';
        const windowStart = launch.window_start || launch.net || 'TBD';
        const provider = launch.launch_service_provider?.name || 'Unknown Provider';
        const location = launch.pad?.location?.name || 'Unknown Location';
        const mission = launch.mission?.description || 'No mission description available.';
        
        // Truncate mission description if it's too long
        const maxDescriptionLength = 200;
        const truncatedMission = mission.length > maxDescriptionLength 
            ? mission.substring(0, maxDescriptionLength) + '...' 
            : mission;

        // Build the HTML for this launch card
        return `
            <div class="launch-card">
                <h2 class="launch-name">${name}</h2>
                <span class="status-badge ${getStatusClass(status)}">${status}</span>
                
                <div class="launch-detail">
                    <strong>Launch Time:</strong>
                    <span>${formatDate(windowStart)}</span>
                </div>
                
                <div class="launch-detail">
                    <strong>Provider:</strong>
                    <span>${provider}</span>
                </div>
                
                <div class="launch-detail">
                    <strong>Location:</strong>
                    <span>${location}</span>
                </div>
                
                <div class="mission-description">
                    <strong>Mission:</strong>
                    <p>${truncatedMission}</p>
                </div>
            </div>
        `;
    }

    /**
     * Fetch launch data from our Flask backend and display it
     */
    function fetchLaunches() {
        // Show loading indicator
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        launchesContainer.innerHTML = '';

        // Make a request to our Flask API endpoint
        fetch('/api/launches')
            .then(response => {
                // Check if the request was successful
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Hide loading indicator
                loadingElement.style.display = 'none';

                // Check if we have any launches
                if (data.results && data.results.length > 0) {
                    // Create a card for each launch
                    const launchCards = data.results.map(launch => createLaunchCard(launch));
                    launchesContainer.innerHTML = launchCards.join('');
                    
                    // Update the last updated time
                    const now = new Date();
                    lastUpdateElement.textContent = now.toLocaleString();
                } else {
                    // No launches found
                    launchesContainer.innerHTML = '<p style="color: white; text-align: center;">No upcoming launches found.</p>';
                }
            })
            .catch(error => {
                // Something went wrong - show error message
                console.error('Error fetching launches:', error);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
            });
    }

    // Fetch launches when the page loads
    fetchLaunches();

    // Optionally, refresh data every 5 minutes (300000 milliseconds)
    setInterval(fetchLaunches, 300000);
});
