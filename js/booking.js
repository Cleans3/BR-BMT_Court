// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');
const authContainer = document.getElementById('authContainer');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const currentWeekDisplay = document.getElementById('currentWeekDisplay');
const selectionSummary = document.getElementById('selectionSummary');
const selectedCount = document.getElementById('selectedCount');
const selectionDetails = document.getElementById('selectionDetails');
const courtTabs = document.querySelectorAll('.court-tab');
const guestBookingModal = document.getElementById('guestBookingModal');
const closeGuestBtn = document.getElementById('closeGuestBtn');
const guestBookingForm = document.getElementById('guestBookingForm');
const guestBookBtn = document.getElementById('guestBookBtn');
// Get the book button - important to get it AFTER the DOM has loaded
const bookButton = document.getElementById('bookButton');

// App State
let currentUser = null;
let selectedSlots = [];
let currentDate = new Date();
let currentCourtPage = 1;
let currentCourtVenue = 'lizunex'; // Default venue
const courtCount = 6;
const courtsPerPage = 6; // Show all 6 courts at once
const daysInWeek = 7;
const courtNames = {
    lizunex: ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"],
    vnbc: ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"] // Fixed to start at 1 instead of 7
};

// Time slots from 7am to 1am with 30-minute intervals
const timeSlots = [];
for (let hour = 7; hour <= 24; hour++) {
    timeSlots.push(`${hour % 24}:00`);
    timeSlots.push(`${hour % 24}:30`);
}
timeSlots.push('1:00');

// Shorter list of time slots for display in the table headers
const displayTimeSlots = [];
for (let hour = 7; hour <= 24; hour += 3) {
    displayTimeSlots.push(`${hour % 24}:00`);
}
displayTimeSlots.push('1:00');

// Rush hours (5 PM - 11 PM weekdays, 9 AM - 11 PM weekends)
function isRushHour(time, day) {
    const hour = parseInt(time.split(':')[0]);
    const isWeekend = (day === 'Sat' || day === 'Sun');
    
    if (isWeekend) {
        return hour >= 9 && hour < 23; // 9 AM - 11 PM on weekends
    } else {
        return hour >= 17 && hour < 23; // 5 PM - 11 PM on weekdays
    }
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
    setupEventListeners();
    loadUserFromStorage();
    loadBookingsFromStorage();
    
    // Force check for admin status when app initializes
    if (currentUser && currentUser.username === 'admint') {
        currentUser.isAdmin = true;
        // Re-save to ensure the isAdmin flag is set
        saveUserToStorage(currentUser);
    }
    
    updateAuthDisplay();
    updateWeekDisplay();
    renderCourts();
    
    // Check if admin notification should be shown
    if (isUserAdmin()) {
        const adminNotice = document.getElementById('adminNotice');
        if (adminNotice) {
            adminNotice.style.display = 'block';
        }
    }

    // Force localStorage to save the admin user if not present
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const adminExists = storedUsers.some(user => user.username === 'admint' && user.isAdmin === true);
    
    if (!adminExists) {
        storedUsers.push({ id: storedUsers.length + 1, username: 'admint', password: 'minhbeo', name: 'Admin User', isAdmin: true });
        localStorage.setItem('users', JSON.stringify(storedUsers));
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
    
    // Week navigation
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => navigateWeek(-7));
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => navigateWeek(7));
    }
    
    // Court tabs navigation
    if (courtTabs && courtTabs.length > 0) {
        courtTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const venue = tab.getAttribute('data-venue');
                currentCourtVenue = venue; // Switch venue
                updateCourtTabs();
                renderCourts();
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
    
    // Get the book button - we need to get this AFTER the DOM has loaded
    const bookBtn = document.getElementById('bookButton');
    
    // Booking button
    if (bookBtn) {
        bookBtn.addEventListener('click', handleBooking);
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
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveUserToStorage(user);
        updateAuthDisplay();
        closeLoginModal();
        renderCourts(); // Re-render to show user's bookings
        
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
    renderCourts(); // Re-render to hide user's bookings
    
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

// Week navigation functions
function navigateWeek(days) {
    currentDate.setDate(currentDate.getDate() + days);
    updateWeekDisplay();
    renderCourts();
}

function updateWeekDisplay() {
    if (!currentWeekDisplay) return;
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)); // Start from Monday
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End on Sunday
    
    const options = { month: 'long', day: 'numeric' };
    const weekStartFormatted = weekStart.toLocaleDateString('en-US', options);
    const weekEndFormatted = weekEnd.toLocaleDateString('en-US', options);
    
    currentWeekDisplay.textContent = `${weekStartFormatted} - ${weekEndFormatted}, ${weekEnd.getFullYear()}`;
}

// Generate court rendering
function renderCourts() {
    console.log("Rendering courts...");
    if (!courtsContainer) {
        console.error("Courts container not found!");
        return;
    }
    
    courtsContainer.innerHTML = '';
    
    // Get the Monday of current week
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    
    // Get the courts for the current venue
    const venueCourtNames = courtNames[currentCourtVenue];
    
    for (let courtIndex = 0; courtIndex < venueCourtNames.length; courtIndex++) {
        // Calculate courtId - courts are numbered 1-6 for each venue separately
        const courtId = courtIndex + 1;
        
        const courtElement = document.createElement('div');
        courtElement.className = 'court-schedule';
        
        courtElement.innerHTML = `
            <div class="court-header">
                <h2>${venueCourtNames[courtIndex]}</h2>
            </div>
            <div class="days-container">
                <div class="table-responsive" style="overflow-x: auto; max-width: 100%;">
                    ${generateDaysForCourt(courtId, weekStart)}
                </div>
            </div>
        `;
        
        courtsContainer.appendChild(courtElement);
    }
    
    // Add event listeners to time slots after rendering
    addTimeSlotListeners();
    console.log("Courts rendered");
}

function generateDaysForCourt(courtId, weekStart) {
    // Create array of days and dates
    const days = [];
    for (let dayOffset = 0; dayOffset < daysInWeek; dayOffset++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayOffset);
        
        const dayOfWeek = dayDate.toLocaleString('en-US', { weekday: 'short' });
        const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dateString = formatDateToYMD(dayDate);
        
        days.push({
            dayOfWeek,
            formattedDate,
            dateString
        });
    }
    
    // Create table structure with hour markings for every hour
    let tableHtml = `
        <table class="court-schedule-table" style="width: 2000px;">
            <thead>
                <tr>
                    <th>Day</th>
                    <th colspan="2">7AM</th>
                    <th colspan="2">8AM</th>
                    <th colspan="2">9AM</th>
                    <th colspan="2">10AM</th>
                    <th colspan="2">11AM</th>
                    <th colspan="2">12PM</th>
                    <th colspan="2">1PM</th>
                    <th colspan="2">2PM</th>
                    <th colspan="2">3PM</th>
                    <th colspan="2">4PM</th>
                    <th colspan="2">5PM</th>
                    <th colspan="2">6PM</th>
                    <th colspan="2">7PM</th>
                    <th colspan="2">8PM</th>
                    <th colspan="2">9PM</th>
                    <th colspan="2">10PM</th>
                    <th colspan="2">11PM</th>
                    <th colspan="2">12AM</th>
                    <th>1AM</th>
                </tr>
                <tr>
                    <th></th>
                    <!-- 7AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 8AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 9AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 10AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 11AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 12PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 1PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 2PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 3PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 4PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 5PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 6PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 7PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 8PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 9PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 10PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 11PM -->
                    <th>:00</th><th>:30</th>
                    <!-- 12AM -->
                    <th>:00</th><th>:30</th>
                    <!-- 1AM -->
                    <th>:00</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows for each day
    for (const day of days) {
        tableHtml += `
            <tr>
                <td style="padding: 5px; min-width: 80px;">
                    <strong>${day.dayOfWeek}</strong><br>
                    <span class="day-date">${day.formattedDate}</span>
                </td>
                ${generateTimeSlotsForDay(courtId, day.dateString, day.dayOfWeek)}
            </tr>
        `;
    }
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    return tableHtml;
}

function generateTimeSlotsForDay(courtId, dateString, dayOfWeek) {
    let slotsHtml = '';
    
    // Calculate the effective court ID based on venue
    // For VNBC courts, add offset to court IDs (1-6 become 7-12)
    const effectiveCourtId = currentCourtVenue === 'vnbc' ? courtId + 6 : courtId;
    
    for (const time of timeSlots) {
        const isOccupied = isSlotOccupied(effectiveCourtId, dateString, time);
        const isUserBooked = isSlotBookedByUser(effectiveCourtId, dateString, time);
        const isRushHourSlot = isRushHour(time, dayOfWeek);
        
        let slotClass = 'time-slot';
        if (isUserBooked) {
            slotClass += ' user-booked';
        } else if (isOccupied) {
            slotClass += ' occupied';
        } else {
            slotClass += ' available';
        }
        
        if (isRushHourSlot) {
            slotClass += ' rush-hour';
        }
        
        slotsHtml += `
            <td>
                <div class="${slotClass}" 
                    data-court="${effectiveCourtId}" 
                    data-date="${dateString}" 
                    data-time="${time}" 
                    data-rush="${isRushHourSlot ? 'true' : 'false'}"></div>
            </td>
        `;
    }
    
    return slotsHtml;
}

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
    
    // Don't allow interaction with occupied slots
    if (timeSlot.classList.contains('occupied')) {
        alert('This slot is already booked.');
        return;
    }
    
    // Don't allow toggling user's already booked slots
    if (timeSlot.classList.contains('user-booked')) {
        return;
    }
    
    // Allow selection even if not logged in
    toggleSlotSelection.call(timeSlot);
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
    // VNBC courts are 7-12, Lizunex are 1-6
    return courtId > 6 ? 'VNBC' : 'Lizunex';
}

function getCourtDisplayName(courtId) {
    // Convert to display name (Court 1-6 for each venue)
    return `Court ${courtId > 6 ? courtId - 6 : courtId}`;
}

function handleBooking() {
    console.log("Handling booking...");
    // Get the bookButton directly to ensure we have the latest reference
    const bookBtn = document.getElementById('bookButton');
    
    if (!selectedSlots.length) {
        console.log("No slots selected");
        return;
    }
    
    if (bookBtn && !bookBtn.classList.contains('active')) {
        console.log("Book button is not active");
        return;
    }
    
    console.log(`Processing booking for ${selectedSlots.length} selected slots`);
    
    // Store the selections in sessionStorage regardless of login status
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
    
    if (currentUser) {
        // Logged in user - redirect to regular payment page
        window.location.href = 'payment.html';
    } else {
        // Guest user - show guest information form
        if (guestBookingModal) {
            guestBookingModal.style.display = 'flex';
        } else {
            // If guest modal doesn't exist for some reason, create default guest
            const guestUser = {
                id: 'guest-' + Date.now(),
                name: 'Guest User',
                isGuest: true
            };
            sessionStorage.setItem('guestUser', JSON.stringify(guestUser));
            window.location.href = 'guest-payment.html';
        }
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

function formatDisplayTime(timeStr) {
    // Convert 24-hour format to 12-hour format
    const [hour, minute] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
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

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);