document.addEventListener('DOMContentLoaded', function () {
    const launchesContainer = document.getElementById('launches-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');

    // Filter elements
    const sortDate = document.getElementById('sort-date');
    const filterProvider = document.getElementById('filter-provider');
    const filterStatus = document.getElementById('filter-status');
    const filterMissionType = document.getElementById('filter-mission-type');
    // 🌟 NEW: Location Filter Element
    const filterLocation = document.getElementById('filter-location');

    // **EXISTING/NEW BUTTONS**
    const recentBtn = document.getElementById('recent-filter-btn');
    const resetBtn = document.getElementById('reset-filter-btn');

    let allLaunches = [];

    // 🌟 NEW: Get URL parameters for pre-filtering (from Upcoming Launches page)
    const urlParams = new URLSearchParams(window.location.search);
    const filterLocationId = urlParams.get('filter_location_id');
    const sourceLaunchName = urlParams.get('source_launch_name');


    // --- Helper Functions ---

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        };
        return date.toLocaleDateString('en-US', options);
    }

    function createLaunchCard(launch) {
        const name = launch.name || 'Unknown Mission';
        const status = launch.status?.name || 'Unknown';
        const windowStart = launch.window_start || launch.net || 'TBD';
        const provider = launch.launch_service_provider?.name || 'Unknown Provider';
        const mission = launch.mission?.type || 'Unknown';
        const location = launch.pad?.location?.name || 'Unknown Location';

        return `
            <div class="launch-card">
                <h2>${name}</h2>
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Launch Time:</strong> ${formatDate(windowStart)}</p>
                <p><strong>Provider:</strong> ${provider}</p>
                <p><strong>Mission Type:</strong> ${mission}</p>
                <p><strong>Location:</strong> ${location}</p>
            </div>
        `;
    }

    // 🌟 NEW: Function to create the special "source" card 
    function createSourceCard(name, locationId) {
        return `
            <div class="launch-card source-card" data-location-id="${locationId}">
                <button class="source-card-reset-btn" id="source-card-reset-btn">❌</button>
                <h2 class="launch-name">Source Mission:</h2>
                <h3 style="color:#f7f7f7; margin-bottom:1rem;">${decodeURIComponent(name)}</h3>
                
                <p>Showing past launches from this site only.</p>
                <p style="font-size:0.9rem; color:#ccc;">Click ❌ to view all launches.</p>
            </div>
        `;
    }

    /**
     * 🌟 NEW: Populates the location filter dropdown with unique location names.
     */
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
        filterStatus.innerHTML = '<option value="all">All</option>';
        filterMissionType.innerHTML = '<option value="all">All</option>';
        providers.forEach(p => filterProvider.innerHTML += `<option value="${p}">${p}</option>`);
        statuses.forEach(s => filterStatus.innerHTML += `<option value="${s}">${s}</option>`);
        missionTypes.forEach(m => filterMissionType.innerHTML += `<option value="${m}">${m}</option>`);

        // 🌟 Populate the new location filter
        populateLocationFilter();
    }


    // **UPDATED FUNCTION:** Resets all filter dropdowns to default and clears URL parameters
    function resetFilters() {
        // Clear URL parameters if they exist
        if (filterLocationId) {
            window.location.href = '/previous'; // Redirect to clear URL filters
            return;
        }

        // Reset all filter dropdowns to their 'All' option
        filterProvider.value = 'all';
        filterStatus.value = 'all';
        filterMissionType.value = 'all';
        if (filterLocation) filterLocation.value = 'all'; // 🌟 Reset location filter

        // Reset the Sort by Date dropdown to 'Most Recent' (value: 'desc')
        if (sortDate) {
            sortDate.value = 'desc';
        }

        // Trigger a re-render
        renderLaunches();
    }


    function filterByRecent() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // First, reset all other filters to show a clean 'Recent' view
        resetFilters();

        // You'll need to update this to call renderLaunches() after setting a 'recent' flag
        // For simplicity now, let's just trigger a re-render.
        renderLaunches();
    }


    // **UPDATED FUNCTION:** Filter and render launches
    function renderLaunches() {
        let filtered = [...allLaunches];

        // 1. 🌟 URL Location Filter (Primary/Initial Filter)
        if (filterLocationId) {
            filtered = filtered.filter(l => String(l.pad?.location?.id) === filterLocationId);
        }

        // 2. 🌟 NEW: Dropdown Location Filter (Applied if no URL filter OR for secondary filtering)
        const selectedLocation = filterLocation ? filterLocation.value : 'all';
        if (!filterLocationId && selectedLocation !== 'all') { // Only use dropdown filter if URL filter is absent
            filtered = filtered.filter(l => l.pad?.location?.name === selectedLocation);
        }

        // 3. Existing Dropdown Filtering
        if (filterProvider.value !== 'all') {
            filtered = filtered.filter(l => l.launch_service_provider?.name === filterProvider.value);
        }
        if (filterStatus.value !== 'all') {
            filtered = filtered.filter(l => l.status?.name === filterStatus.value);
        }
        if (filterMissionType.value !== 'all') {
            filtered = filtered.filter(l => l.mission?.type === filterMissionType.value);
        }


        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(a.window_start || a.net);
            const dateB = new Date(b.window_start || b.net);
            const sortOrder = sortDate ? sortDate.value : 'desc';

            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // 4. Rendering
        const launchCardsHTML = filtered.map(createLaunchCard).join('');

        let finalHTML = '';

        // 🌟 If we have a source launch name, prepend the source card
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

        fetch('/api/previous')
            .then(res => {
                if (!res.ok) throw new Error('Network response not ok');
                return res.json();
            })
            .then(data => {
                allLaunches = data.results || [];
                loadingElement.style.display = 'none';

                populateFilters();
                renderLaunches();
            })
            .catch(err => {
                console.error(err);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
            });
    }

    // 🌟 NEW: Function to handle the "X" button reset
    function handleSourceCardReset(event) {
        if (event.target.id === 'source-card-reset-btn') {
            // Redirect to the /previous page without any URL parameters to reset
            window.location.href = '/previous';
        }
    }


    // Add event listeners for filters (change events)
    [sortDate, filterProvider, filterStatus, filterMissionType, filterLocation].forEach(el => {
        if (el) el.addEventListener('change', renderLaunches);
    });

    // Event Listeners for buttons
    if (recentBtn) {
        recentBtn.addEventListener('click', filterByRecent);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    // 🌟 NEW: Listener for the Source Card's 'X' button
    launchesContainer.addEventListener('click', handleSourceCardReset);


    // Initial fetch
    fetchPreviousLaunches();
});