// Function to format milliseconds into HH:MM:SS
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Function to format a Date object to a readable string
function formatDateTime(date) {
    if (!date) return 'N/A';
    const options = {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    };
    return date.toLocaleString('en-US', options);
}

function formatDateTimeLocal(date){
    if (!date) return 'N/A';
     // Get individual date and time components and pad with leading zeros if necessary
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
     const day = String(date.getDate()).padStart(2, '0');
     const hours = String(date.getHours()).padStart(2, '0');
     const minutes = String(date.getMinutes()).padStart(2, '0');
 
     // Combine into the required format
     const formattedDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;
     return  formattedDatetime;  
     
}

// Function to update the tide clock display
function updateTideClock() {
    const now = new Date();
    currentTimeElem.textContent = formatDateTime(now);

    if (!lastHighTideTimestamp) {
        tideStatusElem.textContent = 'Please set a reference high tide.';
        timeUntilNextElem.textContent = 'N/A';
        nextHighTideElem.textContent = 'N/A';
        nextLowTideElem.textContent = 'N/A';
        return;
    }

    // Calculate minutes since last high tide
    const timeDiffMinutes = (now.getTime() - lastHighTideTimestamp) / (1000 * 60);
    // Get position within the 12h 25m cycle
    const cyclePosition = timeDiffMinutes % TIDE_CYCLE_MINUTES;

    let status = '';
    let timeUntilNext = 0;
    let nextHighTime = new Date(lastHighTideTimestamp);
    let nextLowTime = new Date(lastHighTideTimestamp + HALF_TIDE_CYCLE_MINUTES * 60 * 1000);

    // Adjust nextHighTime and nextLowTime to be in the future relative to 'now'
    while (nextHighTime.getTime() < now.getTime()) {
        nextHighTime.setTime(nextHighTime.getTime() + TIDE_CYCLE_MINUTES * 60 * 1000);
    }
    while (nextLowTime.getTime() < now.getTime()) {
        nextLowTime.setTime(nextLowTime.getTime() + TIDE_CYCLE_MINUTES * 60 * 1000);
    }

    // Determine current tide status and time until next specific tide
    if (cyclePosition >= 0 && cyclePosition < HALF_TIDE_CYCLE_MINUTES) {
        // First half of cycle after high tide: Tide is falling towards low tide
        status = 'Falling';
        // Time until next low tide (from current time to nextLowTime)
        timeUntilNext = nextLowTime.getTime() - now.getTime();
    } else {
        // Second half of cycle after low tide: Tide is rising towards high tide
        status = 'Rising';
        // Time until next high tide (from current time to nextHighTime)
        timeUntilNext = nextHighTime.getTime() - now.getTime();
    }

    // Check if very close to high or low tide (within a small margin, e.g., 5 minutes)
    const timeToNextHigh = nextHighTime.getTime() - now.getTime();
    const timeToNextLow = nextLowTime.getTime() - now.getTime();
    const margin = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (Math.abs(timeToNextHigh) < margin) {
        status = 'High Tide';
    } else if (Math.abs(timeToNextLow) < margin) {
        status = 'Low Tide';
    }


    tideStatusElem.textContent = status;
    timeUntilNextElem.textContent = formatTime(timeUntilNext);
    nextHighTideElem.textContent = formatDateTime(nextHighTime);
    nextLowTideElem.textContent = formatDateTime(nextLowTime);
}

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

// Initialize Lucide Icons
lucide.createIcons();

// DOM elements
const currentTimeElem = document.getElementById('currentTime');
// debugger;
const lastHighTideInput = document.getElementById('lastHighTide');
const setTideBtn = document.getElementById('setTideBtn');
const tideStatusElem = document.getElementById('tideStatus');
const timeUntilNextElem = document.getElementById('timeUntilNext');
const nextHighTideElem = document.getElementById('nextHighTide');
const nextLowTideElem = document.getElementById('nextLowTide');

// Constants for tide calculation
const TIDE_CYCLE_MINUTES = 12 * 60 + 25; // 12 hours 25 minutes in minutes
const HALF_TIDE_CYCLE_MINUTES = TIDE_CYCLE_MINUTES / 2; // ~6 hours 12.5 minutes for high to low or low to high

// Store the last high tide timestamp (milliseconds since epoch)
let lastHighTideTimestamp = localStorage.getItem('lastHighTideTimestamp') ?
    parseInt(localStorage.getItem('lastHighTideTimestamp')) : null;

// Event listener for setting the last high tide
setTideBtn.addEventListener('click', () => {
    if (lastHighTideInput.value) {
        const selectedDate = new Date(lastHighTideInput.value);
        if (!isNaN(selectedDate.getTime())) {
            lastHighTideTimestamp = selectedDate.getTime();
            localStorage.setItem('lastHighTideTimestamp', lastHighTideTimestamp);
            updateTideClock();
        } else {
            // Using a custom message box instead of alert()
            const messageBox = document.createElement('div');
            messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            messageBox.innerHTML = `
                           <div class="bg-white p-6 rounded-lg shadow-xl text-center">
                               <p class="text-lg font-semibold mb-4">Please enter a valid date and time.</p>
                               <button onclick="this.parentNode.parentNode.remove()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">OK</button>
                           </div>
                       `;
            document.body.appendChild(messageBox);
        }
    } else {
        // Using a custom message box instead of alert()
        const messageBox = document.createElement('div');
        messageBox.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        messageBox.innerHTML = `
                       <div class="bg-white p-6 rounded-lg shadow-xl text-center">
                           <p class="text-lg font-semibold mb-4">Please select a date and time for the last high tide.</p>
                           <button onclick="this.parentNode.parentNode.remove()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">OK</button>
                       </div>
                   `;
        document.body.appendChild(messageBox);
    }
});

// Initialize input field
// If a value is stored in localStorage, use it
if (lastHighTideTimestamp) {
    const storedDate = new Date(lastHighTideTimestamp);
    lastHighTideInput.value = formatDateTimeLocal(storedDate);
} else {
    // If no value is stored, pre-select 11 AM ET today
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    // Set known Falmouth High Tide
    lastHighTideInput.value = "2025-08-11T13:15";
    setTideBtn.click();
}

// Update the clock every second
setInterval(updateTideClock, 1000);

// Initial update when the page loads
window.onload = function () {
    updateTideClock();
};

