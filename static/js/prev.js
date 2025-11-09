document.addEventListener('DOMContentLoaded', function () {
    const launchesContainer = document.getElementById('launches-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');

    // Filter elements
    const sortDate = document.getElementById('sort-date');
    const filterProvider = document.getElementById('filter-provider');
    const filterMissionType = document.getElementById('filter-mission-type');
    const filterLocation = document.getElementById('filter-location');
    const resetBtn = document.getElementById('reset-filter-btn');

    let allLaunches = [];

    // Get URL parameters for pre-filtering (from Upcoming Launches page)
    const urlParams = new URLSearchParams(window.location.search);
    const filterLocationId = urlParams.get('filter_location_id');
    const sourceLaunchName = urlParams.get('source_launch_name');

    //for dropdown menu
    const navButton = document.querySelector('.nav-btn');
    const navContent = document.querySelector('.nav-dropdown-content');

    if (navButton && navContent) {
        navButton.addEventListener('click', function(event) {
            // Stop the window click event from firing immediately
            event.stopPropagation(); 
            
            // Toggle 'active' class on the button
            navButton.classList.toggle('active');
            // Toggle 'show' class on the content
            navContent.classList.toggle('show');
        });
    }

    // Close the dropdown if clicking anywhere else on the page
    window.addEventListener('click', function(event) {
        if (navContent && navButton) {
            // Check if the click is outside the button AND outside the content
            if (!navButton.contains(event.target) && !navContent.contains(event.target)) {
                
                // Remove classes to close the dropdown
                navButton.classList.remove('active');
                navContent.classList.remove('show');
            }
        }
    });
    

    //other stuff:
    //(they all have names and are probably self explanatory)

    /**
     * Get a CSS class based on launch status
     * @param {string} status - Status name from API
     * @returns {string} CSS class name
     */


    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        };
        return date.toLocaleDateString('en-US', options);
    }

    //Different from app.js, as it shows success or failure
    function getStatusClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('success')) {
            return 'status-go'; // Re-using 'go' for success
        } else if (statusLower.includes('failure')) {
            return 'status-hold'; // Re-using 'hold' for failure
        } else {
            return 'status-tbd'; // Default/unknown
        }
    }


//Create s the launch card html for each card displayed on screen
function createLaunchCard(launch) {
    const name = launch.name || 'Unknown Mission';
    const status = launch.status?.name || 'Unknown';
    const windowStart = launch.window_start || launch.net || 'TBD';
    const provider = launch.launch_service_provider?.name || 'Unknown Provider';
    const mission = launch.mission?.type || 'Unknown';
    const location = launch.pad?.location?.name || 'Unknown Location';

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
            
            <div class="launch-detail">
                <strong>Mission Type:</strong>
                <span>${mission}</span>
            </div>
        </div>
    `;
    }

    // Function to create the special "source" card 
    function createSourceCard(name, locationId) {
        return `
            <div class="launch-card source-card" data-location-id="${locationId}">
                <button class="source-card-reset-btn" id="source-card-reset-btn">X</button>
                <h2 class="launch-name">Source Mission:</h2>
                <h3 style="color:#f7f7f7; margin-bottom:1rem;">${decodeURIComponent(name)}</h3>
                
                <p>Showing past launches from this site only.</p>
                <p style="font-size:0.9rem; color:#ccc;">Click X to view all previous launches.</p>
            </div>
        `;
    }

    // Populates the location filter dropdown with unique location names.
    
    function populateLocationFilter() {
        if (!filterLocation) return;

        // 1. Get unique location names
        const locations = allLaunches
            .map(l => l.pad?.location?.name)
            .filter((name, index, self) => name && self.indexOf(name) === index)
            .sort();

        // 2. Build HTML options
        let optionsHTML = '<option value="all">All</option>';
        locations.forEach(location => {
            optionsHTML += `<option value="${location}">${location}</option>`;
        });

        filterLocation.innerHTML = optionsHTML;

        // 3. Select the location that matches the incoming URL filter (if applicable)
        if (sourceLaunchName) {
            const launch = allLaunches.find(l => String(l.pad?.location?.id) === filterLocationId);
            if (launch && launch.pad?.location?.name) {
                filterLocation.value = launch.pad.location.name;
            }
        }
    }


    // Populate all filter dropdowns
    function populateFilters() {
        const providers = new Set();
        const statuses = new Set();
        const missionTypes = new Set();
        allLaunches.forEach(launch => {
            if (launch.launch_service_provider?.name) providers.add(launch.launch_service_provider.name);
            if (launch.status?.name) statuses.add(launch.status.name);
            if (launch.mission?.type) missionTypes.add(launch.mission.type);
        });

        // Populate existing filters
        filterProvider.innerHTML = '<option value="all">All</option>';
        filterMissionType.innerHTML = '<option value="all">All</option>';
        providers.forEach(p => filterProvider.innerHTML += `<option value="${p}">${p}</option>`);
        missionTypes.forEach(m => filterMissionType.innerHTML += `<option value="${m}">${m}</option>`);

        // 🌟 Populate the new location filter
        populateLocationFilter();
    }


    // **UPDATED FUNCTION:** Resets all filter dropdowns to default and fetches fresh data
    function resetFilters() {
        // Clear URL parameters if they exist by redirecting
        if (filterLocationId || new URLSearchParams(window.location.search).has('lsp__name')) {
            window.location.href = '/previous';
            return;
        }

        // Reset all filter dropdowns to their 'All' option
        filterProvider.value = 'all';
        if (filterLocation) filterLocation.value = 'all'; // Reset location filter

        // Reset the Sort by Date dropdown to 'Most Recent' (value: 'desc')
        if (sortDate) {
            sortDate.value = 'desc';
        }

        // Trigger a fresh fetch from the API with default parameters
        fetchPreviousLaunches();
    }



        // Filter and render launches
    function renderLaunches() {
        // The data is now pre-filtered by the backend. 
        // We just need to handle sorting and the source card.
        let filtered = [...allLaunches];

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.window_start || a.net);
            const dateB = new Date(b.window_start || b.net);
            const sortOrder = sortDate ? sortDate.value : 'desc';

            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // Rendering
        const launchCardsHTML = filtered.map(createLaunchCard).join('');

        let finalHTML = '';

        // If we have a source launch name, prepend the source card
        if (sourceLaunchName) {
            finalHTML = createSourceCard(sourceLaunchName, filterLocationId) + launchCardsHTML;
        } else {
            finalHTML = launchCardsHTML;
        }


        if (filtered.length === 0 && !sourceLaunchName) {
            launchesContainer.innerHTML = '<p style="text-align: center;">No launches found matching your criteria.</p>';
        } else if (filtered.length === 0 && sourceLaunchName) {
            // Display source card, but no past launches found for that site
            finalHTML = createSourceCard(sourceLaunchName, filterLocationId) +
                '<p style="text-align: center; grid-column: 2 / -1;">No previous launches found for this site.</p>';
        }

        launchesContainer.innerHTML = finalHTML;
    }


    function fetchPreviousLaunches() {
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';
        launchesContainer.innerHTML = '';

        // Get filter values
        const provider = filterProvider.value;
        const locationName = filterLocation ? filterLocation.value : 'all';

        // Find the location ID from the location name
        let locationId = 'all';
        if (locationName !== 'all') {
            const selectedLaunch = allLaunches.find(l => l.pad?.location?.name === locationName);
            if (selectedLaunch) {
                locationId = selectedLaunch.pad.location.id;
            }
        }
        
        // If there's a URL-based location filter, it should take precedence
        if (filterLocationId) {
            locationId = filterLocationId;
        }

        // Build the query string
        const params = new URLSearchParams({
            lsp__name: provider,
            location__ids: locationId,
        });

        fetch(`/api/previous?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error('Network response not ok');
                return res.json();
            })
            .then(data => {
                // If this is the first load, we need to populate filters.
                // After the first load, we only update the displayed launches.
                if (allLaunches.length === 0) {
                    allLaunches = data.results || [];
                    populateFilters(); // This will populate dropdowns with all possible options
                } else {
                    allLaunches = data.results || [];
                }
                
                loadingElement.style.display = 'none';
                renderLaunches(); // Render the newly fetched and filtered data
            })
            .catch(err => {
                console.error(err);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
            });
    }

    // Function to handle the "X" button reset
    function handleSourceCardReset(event) {
        if (event.target.id === 'source-card-reset-btn') {
            // Redirect to the /previous page without any URL parameters to reset
            window.location.href = '/previous';
        }
    }

    // Function to handle the "Read More" toggle for mission descriptions
    function handleToggleMission(event) {
        if (event.target.classList.contains('toggle-mission-btn')) {
            event.preventDefault();

            const button = event.target;
            const card = button.closest('.launch-card');
            const shortText = card.querySelector('.mission-text-short');
            const fullText = card.querySelector('.mission-text-full');

            if (fullText.style.display === 'none') {
                shortText.style.display = 'none';
                fullText.style.display = 'block';
                button.textContent = 'Read Less';
            } else {
                shortText.style.display = 'block';
                fullText.style.display = 'none';
                button.textContent = 'Read More';
            }
        }
    }


    // Add event listeners for filters (change events)
    [sortDate, filterProvider, filterLocation].forEach(el => {
        if (el) el.addEventListener('change', fetchPreviousLaunches);
    });

    // Event Listeners for buttons
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    // Listener for the Source Card's 'X' button
    launchesContainer.addEventListener('click', handleSourceCardReset);
    // Listener for the "Read More" button
    launchesContainer.addEventListener('click', handleToggleMission);


    // Initial fetch
    fetchPreviousLaunches();
});