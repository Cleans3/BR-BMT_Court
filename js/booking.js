// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');
const authContainer = document.getElementById('authContainer');
const prevDayBtn = document.getElementById('prevDay');
const nextDayBtn = document.getElementById('nextDay');
const currentDayDisplay = document.getElementById('currentDayDisplay');
const selectionSummary = document.getElementById('selectionSummary');
const selectedCount = document.getElementById('selectedCount');
const selectionDetails = document.getElementById('selectionDetails');
const courtTabs = document.querySelectorAll('.court-tab');
const guestBookingModal = document.getElementById('guestBookingModal');
const closeGuestBtn = document.getElementById('closeGuestBtn');
const guestBookingForm = document.getElementById('guestBookingForm');
const guestBookBtn = document.getElementById('guestBookBtn');
const bookButton = document.getElementById('bookButton');

// App State
let currentUser = null;
let selectedSlots = [];
let currentDate = new Date();
let currentCourtVenue = 'lizunex'; // Default venue
const courtCounts = {
    'lizunex': 6,
    'vnbc': 9
};
const daysInWeek = 7;
const courtNames = {
    lizunex: ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"],
    vnbc: ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7", "Court 8", "Court 9"]
};

// Time slots from 7am to 1am with 30-minute intervals
const timeSlots = [];
for (let hour = 7; hour <= 24; hour++) {
    timeSlots.push(`${hour % 24}:00`);
    timeSlots.push(`${hour % 24}:30`);
}
timeSlots.push('1:00');

// Format time for display
function formatDisplayTime(timeStr) {
    // Convert 24-hour format to 12-hour format
    const [hour, minute] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}

// Rush hours: 5PM-9PM every day
function isRushHour(time) {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 17 && hour < 21;
}

// Mock database for users and bookings
let users = [
    { id: 1, username: 'admint', password: 'minhbeo', name: 'Admin User', isAdmin: true },
    { id: 2, username: 'user1', password: 'password1', name: 'John Doe', isAdmin: false }
];

let bookings = [
    // Example bookings
    { id: 1, userId: 2, courtId: 1, date: '2025-03-04', time: '10:00' },
    { id: 2, userId: 2, courtId: 1, date: '2025-03-04', time: '10:30' },
    { id: 3, userId: 1, courtId: 3, date: '2025-03-05', time: '18:00' },
    { id: 4, userId: 1, courtId: 3, date: '2025-03-05', time: '18:30' }
];

// Initialize the application
function initApp() {
    console.log("Initializing app...");
    loadUserFromStorage();
    loadBookingsFromStorage();
    
    // Force check for admin status when app initializes
    if (currentUser && currentUser.username === 'admint') {
        currentUser.isAdmin = true;
        // Re-save to ensure the isAdmin flag is set
        saveUserToStorage(currentUser);
    }
    
    // Force localStorage to save the admin user if not present
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const adminExists = storedUsers.some(user => user.username === 'admint' && user.isAdmin === true);
    
    if (!adminExists) {
        storedUsers.push({ id: storedUsers.length + 1, username: 'admint', password: 'minhbeo', name: 'Admin User', isAdmin: true });
        localStorage.setItem('users', JSON.stringify(storedUsers));
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Update auth display
    updateAuthDisplay();
    
    // Check if admin notification should be shown
    if (isUserAdmin()) {
        const adminNotice = document.getElementById('adminNotice');
        if (adminNotice) {
            adminNotice.style.display = 'block';
        }
    }
    
    console.log("App initialization complete");
}

// Load bookings from localStorage
function loadBookingsFromStorage() {
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
        bookings = JSON.parse(storedBookings);
        console.log(`Loaded ${bookings.length} bookings from storage`);
    } else {
        // Initialize with example bookings
        localStorage.setItem('bookings', JSON.stringify(bookings));
        console.log("Initialized example bookings in storage");
    }
}

// Check if user is admin
function isUserAdmin() {
    return currentUser && (currentUser.isAdmin === true || currentUser.username === 'admint');
}

// Setup event listeners
function setupEventListeners() {
    console.log("Setting up event listeners");
    
    // Auth related
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }
    
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', closeLoginModal);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
        if (e.target === guestBookingModal) closeGuestBookingModal();
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Court tabs navigation
    if (courtTabs && courtTabs.length > 0) {
        courtTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                courtTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const venue = tab.getAttribute('data-venue');
                currentCourtVenue = venue; // Switch venue
                
                if (typeof window.renderSingleDayTable === 'function') {
                    window.renderSingleDayTable();
                }
            });
        });
    }
    
    // Guest booking modal
    if (guestBookingForm) {
        guestBookingForm.addEventListener('submit', handleGuestBooking);
    }
    
    if (closeGuestBtn) {
        closeGuestBtn.addEventListener('click', closeGuestBookingModal);
    }
    
    // Guest continue button
    const guestContinueBtn = document.getElementById('guestContinueBtn');
    if (guestContinueBtn) {
        guestContinueBtn.addEventListener('click', function() {
            // Create a default guest user
            const guestUser = {
                id: 'guest-' + Date.now(),
                name: 'Guest User',
                isGuest: true
            };
            sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
            sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
            
            // Redirect to guest payment page
            window.location.href = 'guest-payment.html';
        });
    }
    
    // Booking button
    if (bookButton) {
        bookButton.addEventListener('click', handleBooking);
        console.log("Booking button event listener added");
    } else {
        console.error("Book button not found!");
    }
}

function closeGuestBookingModal() {
    if (guestBookingModal) {
        guestBookingModal.style.display = 'none';
    }
}

// Update court tabs active state
function updateCourtTabs() {
    courtTabs.forEach(tab => {
        const venue = tab.getAttribute('data-venue');
        if (venue === currentCourtVenue) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Authentication functions
function openLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
}

function closeLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
        if (loginForm) {
            loginForm.reset();
        }
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Load users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users')) || users;
    
    const user = storedUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveUserToStorage(user);
        updateAuthDisplay();
        closeLoginModal();
        
        // Re-render the table to show user's bookings
        if (typeof window.renderSingleDayTable === 'function') {
            window.renderSingleDayTable();
        }
        
        // Show admin notice if they're an admin
        if (user.isAdmin) {
            const adminNotice = document.getElementById('adminNotice');
            if (adminNotice) {
                adminNotice.style.display = 'block';
            }
        }
    } else {
        alert('Invalid username or password');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthDisplay();
    
    // Re-render the table to hide user's bookings
    if (typeof window.renderSingleDayTable === 'function') {
        window.renderSingleDayTable();
    }
    
    // Hide admin notice
    const adminNotice = document.getElementById('adminNotice');
    if (adminNotice) {
        adminNotice.style.display = 'none';
    }
}

function saveUserToStorage(user) {
    const userToSave = { ...user };
    
    // Ensure admin flag is set if username is 'admint'
    if (userToSave.username === 'admint') {
        userToSave.isAdmin = true;
    }
    
    // Don't store password
    delete userToSave.password;
    
    localStorage.setItem('currentUser', JSON.stringify(userToSave));
}

function loadUserFromStorage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        
        // Ensure the admin flag is properly set
        if (currentUser.username === 'admint') {
            currentUser.isAdmin = true;
        }
    }
}

function updateAuthDisplay() {
    if (!authContainer) {
        console.error("Auth container not found!");
        return;
    }
    
    if (currentUser) {
        let adminButton = '';
        if (currentUser.isAdmin || currentUser.username === 'admint') {
            adminButton = `
                <a href="admin/dashboard.html" class="admin-dashboard-btn">
                    <i class="fas fa-cogs"></i> Admin Dashboard
                </a>
            `;
        }
        
        authContainer.innerHTML = `
            <div class="user-info">
                <span class="user-name">Welcome, ${currentUser.name}</span>
            </div>
            ${adminButton}
            <button class="btn btn-danger" id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        authContainer.innerHTML = `
            <button class="btn btn-primary login-btn" id="loginBtn">Login</button>
        `;
        document.getElementById('loginBtn').addEventListener('click', openLoginModal);
    }
}

// Add event listeners to time slots
function addTimeSlotListeners() {
    console.log("Adding time slot listeners");
    const slots = document.querySelectorAll('.time-slot');
    
    if (slots.length === 0) {
        console.error("No time slots found to add listeners to!");
        return;
    }
    
    console.log(`Found ${slots.length} time slots to add listeners to`);
    
    slots.forEach(slot => {
        // All time slots, when clicked, will allow selection without requiring login
        slot.addEventListener('click', handleTimeSlotClick);
    });
}

function handleTimeSlotClick(event) {
    const timeSlot = event.currentTarget;
    
    if (timeSlot.classList.contains('occupied')) {
        alert('This slot is already booked.');
        return;
    }
    
    if (timeSlot.classList.contains('user-booked')) {
        return;
    }
    
    validateAndToggleSlot.call(timeSlot);
}

function toggleSlotSelection() {
    const courtId = parseInt(this.dataset.court);
    const date = this.dataset.date;
    const time = this.dataset.time;
    const isRushHour = this.dataset.rush === 'true';
    
    if (this.classList.contains('available')) {
        // Select the slot
        this.classList.remove('available');
        this.classList.add('selected');
        
        selectedSlots.push({
            courtId,
            date,
            time,
            displayTime: formatDisplayTime(time),
            isRushHour
        });
    } else if (this.classList.contains('selected')) {
        // Deselect the slot
        this.classList.remove('selected');
        this.classList.add('available');
        
        // Remove from selected array
        const index = selectedSlots.findIndex(s => 
            s.courtId === courtId && 
            s.date === date && 
            s.time === time
        );
        
        if (index !== -1) {
            selectedSlots.splice(index, 1);
        }
    }
    
    updateBookButtonState();
    updateSelectionSummary();
}

function updateBookButtonState() {
    const bookBtn = document.getElementById('bookButton');
    if (!bookBtn) {
        console.error("Book button not found for state update!");
        return;
    }
    
    if (selectedSlots.length > 0) {
        bookBtn.classList.add('active');
    } else {
        bookBtn.classList.remove('active');
    }
}

function updateSelectionSummary() {
    if (!selectionSummary || !selectedCount || !selectionDetails) {
        console.error("Selection summary elements not found!");
        return;
    }
    
    if (selectedSlots.length > 0) {
        selectedCount.textContent = selectedSlots.length;
        
        // Group selected slots by court and date
        const groupedSlots = {};
        
        selectedSlots.forEach(slot => {
            const venueName = getVenueNameFromCourtId(slot.courtId);
            const courtDisplayName = getCourtDisplayName(slot.courtId);
            const key = `${venueName} ${courtDisplayName} - ${formatDisplayDate(slot.date)}`;
            
            if (!groupedSlots[key]) {
                groupedSlots[key] = [];
            }
            
            const displayTime = `${slot.displayTime}${slot.isRushHour ? ' (Rush)' : ''}`;
            groupedSlots[key].push(displayTime);
        });
        
        let detailsHtml = '';
        for (const [key, times] of Object.entries(groupedSlots)) {
            detailsHtml += `<div><strong>${key}:</strong> ${times.join(', ')}</div>`;
        }
        
        selectionDetails.innerHTML = detailsHtml;
        selectionSummary.classList.remove('hidden');
    } else {
        selectionSummary.classList.add('hidden');
    }
}

function getVenueNameFromCourtId(courtId) {
    // VNBC courts are 7-15, Lizunex are 1-6
    return courtId > 6 ? 'VNBC' : 'Lizunex';
}

function getCourtDisplayName(courtId) {
    // Convert to display name (Court 1-6 for Lizunex, 1-9 for VNBC)
    return `Court ${courtId > 6 ? courtId - 6 : courtId}`;
}

function handleBooking() {
    if (!selectedSlots.length) {
        alert('Please select at least one time slot');
        return;
    }
    
    // Validate booking requirements
    // Group selections by court and date
    const groupedByCourtDate = {};
    
    selectedSlots.forEach(slot => {
        const key = `${slot.courtId}-${slot.date}`;
        if (!groupedByCourtDate[key]) {
            groupedByCourtDate[key] = [];
        }
        groupedByCourtDate[key].push(slot);
    });
    
    // Check each group for continuous chunks of at least 2 slots
    const validChunks = [];
    const invalidGroups = [];
    
    for (const [key, slots] of Object.entries(groupedByCourtDate)) {
        // First, sort slots by time
        slots.sort((a, b) => {
            const [aHour, aMin] = a.time.split(':').map(Number);
            const [bHour, bMin] = b.time.split(':').map(Number);
            return (aHour * 60 + aMin) - (bHour * 60 + bMin);
        });
        
        // Find continuous chunks
        let currentChunk = [slots[0]];
        const chunks = [];
        
        for (let i = 1; i < slots.length; i++) {
            const prevSlot = slots[i-1];
            const currentSlot = slots[i];
            
            // Check if slots are adjacent (30 min apart)
            const [prevHour, prevMin] = prevSlot.time.split(':').map(Number);
            const [currentHour, currentMin] = currentSlot.time.split(':').map(Number);
            
            const prevTimeInMin = prevHour * 60 + prevMin;
            const currentTimeInMin = currentHour * 60 + currentMin;
            
            if (currentTimeInMin - prevTimeInMin === 30) {
                // Adjacent, add to current chunk
                currentChunk.push(currentSlot);
            } else {
                // Not adjacent, start new chunk if current one has at least 2 slots
                if (currentChunk.length >= 2) {
                    chunks.push([...currentChunk]);
                } else {
                    invalidGroups.push([...currentChunk]);
                }
                currentChunk = [currentSlot];
            }
        }
        
        // Add the final chunk if it has at least 2 slots
        if (currentChunk.length >= 2) {
            chunks.push(currentChunk);
        } else {
            invalidGroups.push(currentChunk);
        }
        
        // Add valid chunks to overall list
        validChunks.push(...chunks);
    }
    
    // Validation criteria
    let isValid = true;
    let validationMessage = "";
    
    if (validChunks.length === 0) {
        isValid = false;
        validationMessage = "Please select at least 2 adjacent time slots.";
    } else if (validChunks.length > 1) {
        // Sort chunks by start time
        validChunks.sort((a, b) => {
            const [aHour, aMin] = a[0].time.split(':').map(Number);
            const [bHour, bMin] = b[0].time.split(':').map(Number);
            return (aHour * 60 + aMin) - (bHour * 60 + bMin);
        });
        
        // Check spacing between chunks
        for (let i = 1; i < validChunks.length; i++) {
            const prevChunkEnd = validChunks[i-1][validChunks[i-1].length - 1];
            const currentChunkStart = validChunks[i][0];
            
            // Calculate time difference
            const [prevHour, prevMin] = prevChunkEnd.time.split(':').map(Number);
            const [currentHour, currentMin] = currentChunkStart.time.split(':').map(Number);
            
            const prevTimeInMin = prevHour * 60 + prevMin;
            const currentTimeInMin = currentHour * 60 + currentMin;
            const timeDiff = currentTimeInMin - prevTimeInMin;
            
            // Must be at least 60 minutes apart (more than 1 time frame)
            if (timeDiff <= 60) {
                isValid = false;
                validationMessage = "Time groups must be at least 1 hour apart.";
                break;
            }
        }
    }
    
    // Check for single slots that aren't part of valid chunks
    if (invalidGroups.length > 0 && invalidGroups.some(group => group.length === 1)) {
        if (isValid) {
            isValid = false;
            validationMessage = "All selected slots must be part of groups of at least 2 adjacent slots.";
        }
    }
    
    if (!isValid) {
        alert(validationMessage);
        return;
    }
    
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
    
    if (currentUser) {
        window.location.href = 'payment.html';
    } else {
        loginModal.style.display = 'flex';
    }
}

function handleGuestBooking(e) {
    e.preventDefault();
    
    // Get guest information
    const guestName = document.getElementById('guestName').value;
    const guestPhone = document.getElementById('guestPhone').value;
    
    if (!guestName || !guestPhone) {
        alert('Please enter your name and phone number');
        return;
    }
    
    // Create a guest user object
    const guestUser = {
        id: 'guest-' + Date.now(),
        name: guestName,
        phone: guestPhone,
        isGuest: true
    };
    
    // Store guest info and selected slots
    sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
    
    // Redirect to guest payment page
    window.location.href = 'guest-payment.html';
}

// Helper functions
function formatDateToYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isSlotOccupied(courtId, date, time) {
    // Check if the slot is booked by anyone
    return bookings.some(booking => 
        booking.courtId === courtId && 
        booking.date === date && 
        booking.time === time
    );
}

function isSlotBookedByUser(courtId, date, time) {
    // Check if the slot is booked by the current user
    if (!currentUser) return false;
    
    return bookings.some(booking => 
        booking.courtId === courtId && 
        booking.date === date && 
        booking.time === time && 
        booking.userId === currentUser.id
    );
}

// Make these functions available to the global scope for the single day table
window.isSlotOccupied = isSlotOccupied;
window.isSlotBookedByUser = isSlotBookedByUser;
window.addTimeSlotListeners = addTimeSlotListeners;
window.toggleSlotSelection = toggleSlotSelection;
window.formatDisplayTime = formatDisplayTime;
window.selectedSlots = selectedSlots;

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);