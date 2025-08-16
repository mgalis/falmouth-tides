// Register the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}



// Get DOM elements
        const currentTimeDisplay = document.getElementById('currentTime');
        const tideDatetimeSelect = document.getElementById('tide-datetime-select');
        const tideStatusDisplay = document.getElementById('tideStatus');
        const timeUntilNextDisplay = document.getElementById('timeUntilNext');
        const nextHighTideDisplay = document.getElementById('nextHighTide');
        const nextLowTideDisplay = document.getElementById('nextLowTide');


        const knownHighTides = [
            { beach: 'Falmouth Heights', knownHighTide : '2025-08-11T13:15' },
            { beach: 'Menauhant Beach', knownHighTide : '2025-08-15T04:07' },
            { beach: 'Wood Neck', knownHighTide : '2025-08-15T13:31' },
            { beach: 'Stoney', knownHighTide : '2025-08-15T04:04' },
            { beach: 'Chapoquoit', knownHighTide : '2025-08-15T13:22' },
            { beach: 'Old Silver', knownHighTide : '2025-08-15T13:25' }
        ]
        // Define the tide cycle (12 hours and 25 minutes in milliseconds)
        const TIDE_CYCLE_MS = (12 * 60 + 25) * 60 * 1000;

        // Variable to store the last high tide timestamp
        var lastHighTideTimestamp;

        /**
         * Formats a given Date object into a readable time string (e.g., "HH:MM AM/PM").
         * @param {Date} date - The date object to format.
         * @returns {string} The formatted time string.
         */
        function formatTime(date) {
            if (!date) return 'N/A';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        /**
         * Formats a given Date object into a readable date string (e.g., "Mon, Aug 14").
         * @param {Date} date - The date object to format.
         * @returns {string} The formatted date string.
         */
        function formatDate(date) {
            if (!date) return 'N/A';
            return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        }

        /**
         * Updates the current time displayed on the page.
         */
        function updateCurrentTime() {
            const now = new Date();
            currentTimeDisplay.textContent = formatTime(now);
        }

        /**
         * Populates the single datetime dropdown with options representing prior high tides.
         */
        function populateDatetimeDropdown() {
            tideDatetimeSelect.innerHTML = ''; // Clear existing options

            
            // Add a default disabled placeholder option (not initially selected)
            const defaultPlaceholderOption = document.createElement('option');
            defaultPlaceholderOption.value = "";
            defaultPlaceholderOption.textContent = "-- Select Beach to See Tide Info --";
            defaultPlaceholderOption.disabled = true;
            tideDatetimeSelect.appendChild(defaultPlaceholderOption);

            let hasPreselectedOption = false; // Flag to track if any option has been explicitly selected

            // Generate 1 upcoming high tide options
            for (let i = 0; i < knownHighTides.length; i++) {
                const option = document.createElement('option');
                option.value = knownHighTides[i].knownHighTide; // Store timestamp as value
                option.textContent = knownHighTides[i].beach;
                tideDatetimeSelect.appendChild(option);
            }
            
        }

        /**
         * Calculates and displays the current tide status and next tide times.
         */
        function calculateTides() {
            // Calculate current tide status
            let tideStatus = '';
            let timeToNextTide = 0;
            let nextHighTideTime, nextLowTideTime;

            if (!lastHighTideTimestamp) {
                tideStatusDisplay.textContent = 'Not Set';
                timeUntilNextDisplay.textContent = 'N/A';
                nextHighTideDisplay.textContent = 'N/A';
                nextLowTideDisplay.textContent = 'N/A';
                return;
            }
            const now = new Date().getTime();
            let timeSinceLastHigh = now - lastHighTideTimestamp;

            // Normalize timeSinceLastHigh to be within one tide cycle
            timeSinceLastHigh %= TIDE_CYCLE_MS;
            if (timeSinceLastHigh < 0) {
                timeSinceLastHigh += TIDE_CYCLE_MS; // Ensure positive if modulo results in negative
            }
            lastHighTideTimestamp = now - timeSinceLastHigh;
            nextHighTideTime = lastHighTideTimestamp + TIDE_CYCLE_MS;
            nextLowTideTime = lastHighTideTimestamp + TIDE_CYCLE_MS / 2;
            if( nextLowTideTime < now ) {
                nextLowTideTime += TIDE_CYCLE_MS;
                timeToNextTide = nextHighTideTime - now;
            }
            else {
                timeToNextTide = nextLowTideTime - now;
            }


            if (timeSinceLastHigh < TIDE_CYCLE_MS / 4) { // First quarter: high tide to half tide (falling)
                tideStatus = 'Falling';
            } else if (timeSinceLastHigh < TIDE_CYCLE_MS / 2) { // Second quarter: half tide to low tide (falling)
                tideStatus = 'Low Tide Approaching';
            } else if (timeSinceLastHigh < (3 * TIDE_CYCLE_MS) / 4) { // Third quarter: low tide to half tide (rising)
                tideStatus = 'Rising';
            } else { // Fourth quarter: half tide to high tide (rising)
                tideStatus = 'High Tide Approaching';
            }

            tideStatusDisplay.textContent = tideStatus;
            
            // Format time until next tide
            const hours = Math.floor(timeToNextTide / (1000 * 60 * 60));
            const minutes = Math.floor((timeToNextTide % (1000 * 60 * 60)) / (1000 * 60));
            timeUntilNextDisplay.textContent = `${hours}h ${minutes}m`;

            nextHighTideDisplay.textContent = formatTime(new Date(nextHighTideTime)) + ' ' + formatDate(new Date(nextHighTideTime));
            nextLowTideDisplay.textContent = formatTime(new Date(nextLowTideTime)) + ' ' + formatDate(new Date(nextLowTideTime));
        }

        // Add event listener to the dropdown for 'change' events
        tideDatetimeSelect.addEventListener('change', () => {
            const selectedTimestamp = tideDatetimeSelect.value;


            lastHighTideTimestamp = new Date(selectedTimestamp).getTime() - TIDE_CYCLE_MS;
            if (isNaN(lastHighTideTimestamp)) {
                console.error("No valid tide time selected. Please choose an option from the dropdown.");
                return;
            }
            calculateTides(); // Recalculate tides with the new input
        });

        // Initialize dropdown and update current time/tides on page load
        window.onload = function () {
            populateDatetimeDropdown(); // Populate the single dropdown
            updateCurrentTime();
            selectedTimestamp = knownHighTides[0].knownHighTide;
            tideDatetimeSelect.value=selectedTimestamp;


            lastHighTideTimestamp = new Date(selectedTimestamp).getTime() - TIDE_CYCLE_MS;
            if (isNaN(lastHighTideTimestamp)) {
                console.error("No valid tide time preselected. Please choose an option from the dropdown.");
                return;
            }
            calculateTides(); // Initial calculation based on stored or default value

            // Update current time and tide predictions every minute
            setInterval(updateCurrentTime, 60000);
            setInterval(calculateTides, 60000); // Recalculate tides every minute
        };
