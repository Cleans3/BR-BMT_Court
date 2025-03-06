// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');
const bookBtn = document.getElementById('bookButton');
const courtsContainer = document.getElementById('courtsContainer');
const authContainer = document.getElementById('authContainer');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');
const currentWeekDisplay = document.getElementById('currentWeekDisplay');
const selectionSummary = document.getElementById('selectionSummary');
const selectedCount = document.getElementById('selectedCount');
const selectionDetails = document.getElementById('selectionDetails');

// App State
let currentUser = null;
let selectedSlots = [];
let currentDate = new Date();
const courtCount = 6;
const daysInWeek = 7;
const courtNames = [
    "Court 1", "Court 2", "Court 3", 
    "Court 4", "Court 5", "Court 6"
];

// Time slots from 7am to 1am with 30-minute intervals
const timeSlots = [];
for (let hour = 7; hour <= 24; hour++) {
    timeSlots.push(`${hour % 24}:00`);
    timeSlots.push(`${hour % 24}:30`);
}
timeSlots.push('1:00');

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
    setupEventListeners();
    loadUserFromStorage();
    updateAuthDisplay();
    updateWeekDisplay();
    renderCourts();
}

// Setup event listeners
function setupEventListeners() {
    // Auth related
    loginBtn.addEventListener('click', openLoginModal);
    closeLoginBtn.addEventListener('click', closeLoginModal);
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
    });
    loginForm.addEventListener('submit', handleLogin);
    
    // Week navigation
    prevWeekBtn.addEventListener('click', () => navigateWeek(-7));
    nextWeekBtn.addEventListener('click', () => navigateWeek(7));
    
    // Booking
    bookBtn.addEventListener('click', handleBooking);
}

// Authentication functions
function openLoginModal() {
    loginModal.style.display = 'flex';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
    loginForm.reset();
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
    } else {
        alert('Invalid username or password');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthDisplay();
    renderCourts(); // Re-render to hide user's bookings
}

function saveUserToStorage(user) {
    const userToSave = { ...user };
    delete userToSave.password; // Don't store password
    localStorage.setItem('currentUser', JSON.stringify(userToSave));
}

function loadUserFromStorage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
}

function updateAuthDisplay() {
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-info">
                <span class="user-name">Welcome, ${currentUser.name}</span>
            </div>
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
    courtsContainer.innerHTML = '';
    
    // Get the Monday of current week
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1));
    
    for (let courtId = 1; courtId <= courtCount; courtId++) {
        const courtElement = document.createElement('div');
        courtElement.className = 'court-schedule';
        
        courtElement.innerHTML = `
            <div class="court-header">
                <h2>${courtNames[courtId - 1]}</h2>
            </div>
            <div class="days-container" id="court-${courtId}-days">
                ${generateDaysForCourt(courtId, weekStart)}
            </div>
        `;
        
        courtsContainer.appendChild(courtElement);
    }
    
    // Add event listeners to time slots after rendering
    addTimeSlotListeners();
}

function generateDaysForCourt(courtId, weekStart) {
    let daysHtml = '';
    
    for (let dayOffset = 0; dayOffset < daysInWeek; dayOffset++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayOffset);
        
        const dayOfWeek = dayDate.toLocaleString('en-US', { weekday: 'long' });
        const formattedDate = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dateString = formatDateToYMD(dayDate);
        
        daysHtml += `
            <div class="day-row">
                <div class="day-label">
                    <span>${dayOfWeek}</span>
                    <span class="day-date">${formattedDate}</span>
                </div>
                <div class="time-slot-container" data-court="${courtId}" data-date="${dateString}">
                    ${generateTimeSlotsForDay(courtId, dateString)}
                </div>
            </div>
        `;
    }
    
    return daysHtml;
}

function generateTimeSlotsForDay(courtId, dateString) {
    let slotsHtml = '';
    
    for (const time of timeSlots) {
        const isOccupied = isSlotOccupied(courtId, dateString, time);
        const isUserBooked = isSlotBookedByUser(courtId, dateString, time);
        
        let slotClass = 'time-slot';
        if (isUserBooked) {
            slotClass += ' user-booked';
        } else if (isOccupied) {
            slotClass += ' occupied';
        } else {
            slotClass += ' available';
        }
        
        slotsHtml += `
            <div class="${slotClass}" data-court="${courtId}" data-date="${dateString}" data-time="${time}">
                ${formatDisplayTime(time)}
            </div>
        `;
    }
    
    return slotsHtml;
}

function addTimeSlotListeners() {
    const slots = document.querySelectorAll('.time-slot');
    
    slots.forEach(slot => {
        if (!slot.classList.contains('occupied')) {
            slot.addEventListener('click', toggleSlotSelection);
        }
    });
}

function toggleSlotSelection() {
    // Don't allow selection if not logged in
    if (!currentUser) {
        openLoginModal();
        return;
    }
    
    // Don't allow toggling user's already booked slots
    if (this.classList.contains('user-booked')) {
        return;
    }
    
    const courtId = parseInt(this.dataset.court);
    const date = this.dataset.date;
    const time = this.dataset.time;
    
    if (this.classList.contains('available')) {
        // Select the slot
        this.classList.remove('available');
        this.classList.add('selected');
        
        selectedSlots.push({
            courtId,
            date,
            time,
            displayTime: formatDisplayTime(time)
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
    if (selectedSlots.length > 0) {
        bookBtn.classList.add('active');
    } else {
        bookBtn.classList.remove('active');
    }
}

function updateSelectionSummary() {
    if (selectedSlots.length > 0) {
        selectedCount.textContent = selectedSlots.length;
        
        // Group selected slots by court and date
        const groupedSlots = {};
        
        selectedSlots.forEach(slot => {
            const key = `Court ${slot.courtId} - ${formatDisplayDate(slot.date)}`;
            if (!groupedSlots[key]) {
                groupedSlots[key] = [];
            }
            groupedSlots[key].push(slot.displayTime);
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

function handleBooking() {
    if (!selectedSlots.length || !bookBtn.classList.contains('active')) {
        return;
    }
    
    // Store selections in sessionStorage for the payment page
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
    
    // Redirect to payment page
    window.location.href = 'payment.html';
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