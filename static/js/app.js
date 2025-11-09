/**
 * Space Mission Tracker - JavaScript
 * This file handles fetching launch data from our Flask backend
 * and displaying it on the page
 */

// Wait for the page to fully load before running our code
document.addEventListener('DOMContentLoaded', function () {
    // Get references to important elements on the page
    const launchesContainer = document.getElementById('launches-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const lastUpdateElement = document.getElementById('last-update');

    // NEW: Handle the click for the "Find Past Launches" button
    launchesContainer.addEventListener('click', handleCompareClick);
    // NEW: Handle the click for the "Read More" mission toggle
    launchesContainer.addEventListener('click', handleToggleMission);
    launchesContainer.addEventListener('click', handleShareClick);

    // --- Helper Functions ---

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
     * Creates HTML for the Previous Launches navigation button card.
     * @returns {string} HTML string for the image button card.
     */
    function createNavButtonHtml() {
        // We reuse the 'launch-card' class to ensure it integrates with the grid.
        return `
            <a href="/previous" class="nav-image-button launch-card">
                <img src="{{ url_for('static', filename='img/past_missions_default.jpg') }}" 
                     alt="Previous Launches Dashboard">
                <span>Explore Past Missions</span>
            </a>
        `;
    }

    /**
     * Creates a Google Calendar event link.
     * @param {object} launch - Launch data object from API
     * @returns {string} A URL for a new Google Calendar event
     */
    function createGoogleCalendarLink(launch) {
        // Get the core data
        const name = launch.name || 'Unknown Mission';
        const windowStart = launch.window_start || launch.net;
        const location = launch.pad?.location?.name || 'Unknown Location';
        const mission = launch.mission?.description || 'No mission description available.';

        // Google Calendar requires UTC datetimes in a specific format
        // (YYYYMMDD'T'HHMMSS'Z')
        // We can re-parse the ISO string to get a clean UTC format.
        try {
            const startDate = new Date(windowStart);
            
            // Format the start time. .toISOString() is ALMOST correct, 
            // but we need to remove hyphens, colons, and milliseconds.
            const googleStartDate = startDate.toISOString().replace(/[-:]|\.\d{3}/g, '');

            // Let's create an end time (e.g., 1 hour after start) as a fallback
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
            const googleEndDate = endDate.toISOString().replace(/[-:]|\.\d{3}/g, '');

            // Build the URL
            const url = new URL('https://www.google.com/calendar/render');
            url.searchParams.set('action', 'TEMPLATE');
            url.searchParams.set('text', `${name}`);
            url.searchParams.set('dates', `${googleStartDate}/${googleEndDate}`);
            url.searchParams.set('details', `${mission}\n\nProvider: ${launch.launch_service_provider?.name}`);
            url.searchParams.set('location', location);
            url.searchParams.set('ctz', 'UTC'); // Specify dates are in UTC

            return url.href;

        } catch (e) {
            // If the date is invalid, don't return a link
            console.error('Could not parse date for calendar link:', windowStart);
            return null;
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

        // NEW: Get the location ID to use as a filter parameter
        const locationId = launch.pad?.location?.id;

        // Truncate mission description if it's too long
        const maxDescriptionLength = 200;
        let missionHtml;

        /*const truncatedMission = mission.length > maxDescriptionLength
            ? mission.substring(0, maxDescriptionLength) + '...'
            : mission;
        */

            if (mission.length > maxDescriptionLength) {
                // Text is long, create truncated and full versions
                const truncatedMission = mission.substring(0, maxDescriptionLength) + '...';
                missionHtml = `
                    <div class="mission-description">
                        <strong>Mission:</strong>
                        <p class="mission-text-short">${truncatedMission}</p>
                        <p class="mission-text-full" style="display: none;">${mission}</p>
                        <a href="#" class="toggle-mission-btn">Read More</a>
                    </div>
                `;
            } else {
                // Text is short, just display it
                missionHtml = `
                    <div class="mission-description">
                        <strong>Mission:</strong>
                        <p>${mission}</p>
                    </div>
                `;
            }

            // --- NEW: Calendar Link Logic ---
        const calendarLink = createGoogleCalendarLink(launch);
        let calendarButtonHtml = '';
        if (calendarLink) {
            // We use <a> styled as a button. target="_blank" opens in new tab.
            calendarButtonHtml = `
                <a href="${calendarLink}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="calendar-btn">
                    Add to Google Calendar
                </a>
            `;
        }
        // --- End of NEW Logic ---


        const localTime = (windowStart !== 'TBD') ? formatDate(windowStart) : 'TBD';
                    // --- NEW: Share Button Data ---
        // We pass the formatted local time to the share button
        const shareData = {
            name: name,
            provider: provider,
            time: localTime
            };



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
                
                ${missionHtml}

                <div class="card-button-group">
                    ${calendarButtonHtml}
                    
                    <button class="compare-btn" data-location-id="${locationId}" data-launch-name="${name}">
                        Find Past Launches at This Location
                    </button>

                    <button class="share-btn" 
                            data-name="${shareData.name}" 
                            data-provider="${shareData.provider}" 
                            data-time="${shareData.time}">
                        Share Launch
                    </button>
                </div>
            </div>
        `;
    }


    /**
     * Handles clicks on the "Read More" / "Show Less" mission toggle.
     */
    function handleToggleMission(event) {
        const target = event.target;
        // Check if the clicked element is a toggle button
        if (!target.classList.contains('toggle-mission-btn')) return;

        event.preventDefault(); // Stop the <a> tag's default action

        // Find the parent .mission-description container
        const descriptionContainer = target.closest('.mission-description');
        if (!descriptionContainer) return;

        const shortText = descriptionContainer.querySelector('.mission-text-short');
        const fullText = descriptionContainer.querySelector('.mission-text-full');

        // Check the display style of the full text to see current state
        if (fullText.style.display === 'none') {
            // We are currently truncated, so expand
            fullText.style.display = 'block';
            shortText.style.display = 'none';
            target.textContent = 'Show Less';
        } else {
            // We are currently expanded, so truncate
            fullText.style.display = 'none';
            shortText.style.display = 'block';
            target.textContent = 'Read More';
        }
    }



    /**
     * Handles clicks on the "Find Past Launches" button, redirecting and passing the filter.
     */
    function handleCompareClick(event) {
        const target = event.target;
        // Check if the clicked element is a compare button
        if (!target.classList.contains('compare-btn')) return;

        const locationId = target.dataset.locationId;
        const launchName = target.dataset.launchName;

        if (locationId) {
            // Redirect to /previous, passing the location ID and launch name as URL parameters
            window.location.href = `/previous?filter_location_id=${locationId}&source_launch_name=${encodeURIComponent(launchName)}`;
        } else {
            alert('Location data is missing for this launch. Cannot filter past missions.');
        }
    }


    /**
     * Handles clicks on the "Share Launch" button.
     * Uses Web Share API if available, otherwise copies to clipboard.
     */
    async function handleShareClick(event) {
        const target = event.target;
        // Check if the clicked element is a share button
        if (!target.classList.contains('share-btn')) return;

        // Get the launch data from the button's dataset
        const { name, provider, time } = target.dataset;

        // --- THIS IS THE FIX ---
        // Combine the text and URL into a single string.
        // This ensures all apps (clipboard, SMS, X) receive the full message.
        const shareText = `Check out this launch: ${name} by ${provider} on ${time}. ${window.location.href}`;

        // Create the shareData object.
        // We will pass EITHER this object (to navigator.share)
        // OR just the shareText (to clipboard)
        const shareData = {
            //title: `Rocket Launch: ${name}`,
            text: shareText
            // By omitting the 'url' field, we force the share sheet
            // to use the 'text' field, which now contains the URL.
        };
        // --- END OF FIX ---


        // 1. Try using the modern Web Share API
        if (navigator.share) {
            try {
                // Pass the new object that only has .title and .text
                await navigator.share(shareData);
                console.log('Launch shared successfully');
            } catch (err) {
                // User might have canceled the share
                console.log('Share canceled or failed:', err);
            }
        } 
        // 2. Fallback to clipboard for desktop
        else if (navigator.clipboard) {
            try {
                // Pass the new combined text
                await navigator.clipboard.writeText(shareText); 
                
                // Give user feedback
                const originalText = target.textContent;
                target.textContent = 'Copied to Clipboard!';
                target.classList.add('copied'); // For styling

                setTimeout(() => {
                    target.textContent = originalText;
                    target.classList.remove('copied');
                }, 2000); // Reset after 2 seconds

            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                alert('Failed to copy. Please copy the text manually.');
            }
        } 
        // 3. Absolute fallback
        else {
            alert('Sharing is not supported on this browser.');
        }
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

                // 1. Create launch cards HTML
                const launchCardsHTML = data.results && data.results.length > 0
                    ? data.results.map(launch => createLaunchCard(launch)).join('')
                    : '';

                // 2. Inject the Navigation Button HTML
                const navButtonHTML = createNavButtonHtml();

                // 3. Combine and display all content
                if (data.results && data.results.length > 0) {
                    // Create a card for each launch
                    const launchCards = data.results.map(launch => createLaunchCard(launch));
                    launchesContainer.innerHTML = launchCards.join('');
                    
                    // Update the last updated time. Prefer the cached timestamp
                    // provided by the backend (`cached_timestamp`) which reflects
                    // when the data file was last written. Fall back to current
                    // time if the field is missing.
                    if (data.cached_timestamp) {
                        try {
                            const cachedDate = new Date(data.cached_timestamp);
                            lastUpdateElement.textContent = cachedDate.toLocaleString();
                        } catch (e) {
                            // If parsing fails use the current time
                            lastUpdateElement.textContent = new Date().toLocaleString();
                        }
                    } else {
                        lastUpdateElement.textContent = new Date().toLocaleString();
                    }
                } else {
                    // If no launches, display the button plus the 'No launches found' message
                    launchesContainer.innerHTML = navButtonHTML +
                        '<p style="color: white; text-align: center; grid-column: 1 / -1; margin-top: 2rem;">No upcoming launches found.</p>';

                    // Update the last updated time even if no launches are found
                    const now = new Date();
                    lastUpdateElement.textContent = now.toLocaleString();
                }
            })
            .catch(error => {
                // Something went wrong - show error message
                console.error('Error fetching launches:', error);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
                // Display the nav button even on error, so users can still navigate
                launchesContainer.innerHTML = createNavButtonHtml();
            });
    }

    // Fetch launches when the page loads
    fetchLaunches();

    // Optionally, refresh data every 5 minutes (300000 milliseconds)
    setInterval(fetchLaunches, 300000);
});