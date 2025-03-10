// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const guestLoginModal = document.getElementById('guestLoginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const closeGuestLoginBtn = document.getElementById('closeGuestLoginBtn');
const loginForm = document.getElementById('loginForm');
const guestLoginForm = document.getElementById('guestLoginForm');
const authContainer = document.getElementById('authContainer');
const selectionSummary = document.getElementById('selectionSummary');
const selectedCount = document.getElementById('selectedCount');
const selectionDetails = document.getElementById('selectionDetails');
const validationMessage = document.getElementById('validationMessage');
const bookButton = document.getElementById('bookButton');
const guestContinueBtn = document.getElementById('guestContinueBtn');

// App State
let currentUser = null;
let selectedSlots = [];
let currentVenue = 'lizunex'; // Default venue
const courtCounts = {
    'lizunex': 6,
    'vnbc': 9
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
    { id: 1, userId: 2, courtId: 1, date: '2025-03-10', time: '10:00' },
    { id: 2, userId: 2, courtId: 1, date: '2025-03-10', time: '10:30' },
    { id: 3, userId: 1, courtId: 3, date: '2025-03-10', time: '18:00' },
    { id: 4, userId: 1, courtId: 3, date: '2025-03-10', time: '18:30' }
];

// Initialize the application
function initApp() {
    loadUserFromStorage();
    loadBookingsFromStorage();
    
    // Force check for admin status when app initializes
    if (currentUser && currentUser.username === 'admint') {
        currentUser.isAdmin = true;
        saveUserToStorage(currentUser);
    }
    
    // Initialize users if they don't exist
    initializeUsers();
    
    // Load saved selected slots
    loadSavedSelectedSlots();
    
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
}

// Initialize users
function initializeUsers() {
    const storedUsers = JSON.parse(localStorage.getItem('users'));
    
    if (!storedUsers || storedUsers.length === 0) {
        localStorage.setItem('users', JSON.stringify(users));
    } else {
        // Make sure admin exists
        const adminExists = storedUsers.some(user => user.username === 'admint' && user.isAdmin === true);
        if (!adminExists) {
            storedUsers.push({ 
                id: storedUsers.length + 1, 
                username: 'admint', 
                password: 'minhbeo', 
                name: 'Admin User', 
                isAdmin: true 
            });
            localStorage.setItem('users', JSON.stringify(storedUsers));
        }
    }
}

// Load saved selected slots from localStorage for all dates
function loadSavedSelectedSlots() {
    selectedSlots = [];
    
    // Get all localStorage keys that match the selected_slots pattern
    const dateKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('selected_slots_')) {
            dateKeys.push(key);
        }
    }
    
    // Load all saved selections
    dateKeys.forEach(key => {
        const savedSelections = JSON.parse(localStorage.getItem(key)) || [];
        selectedSlots = [...selectedSlots, ...savedSelections];
    });
    
    // Update UI
    updateBookButtonState();
    updateSelectionSummary();
    validateBookingSelection();
}

// Load bookings from localStorage
function loadBookingsFromStorage() {
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
        bookings = JSON.parse(storedBookings);
    } else {
        // Initialize with example bookings
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
}

// Check if user is admin
function isUserAdmin() {
    return currentUser && (currentUser.isAdmin === true || currentUser.username === 'admint');
}

// Setup event listeners
function setupEventListeners() {
    // Auth related
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }
    
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', closeLoginModal);
    }
    
    if (closeGuestLoginBtn) {
        closeGuestLoginBtn.addEventListener('click', closeGuestLoginModal);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLoginModal();
        if (e.target === guestLoginModal) closeGuestLoginModal();
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (guestLoginForm) {
        guestLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('guestUsername').value;
            const password = document.getElementById('guestPassword').value;
            
            // Get users from localStorage
            const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
            
            const user = storedUsers.find(u => u.username === username && u.password === password);
            
            if (user) {
                currentUser = user;
                saveUserToStorage(user);
                
                // Store selected slots in session storage for payment page
                sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
                
                // Redirect to payment page
                window.location.href = 'payment.html';
            } else {
                alert('Invalid username or password');
            }
        });
    }
    
    // Booking button
    if (bookButton) {
        bookButton.addEventListener('click', handleBooking);
    }
    
    // Guest continue button
    if (guestContinueBtn) {
        guestContinueBtn.addEventListener('click', function() {
            // Store selected slots in session storage for guest payment page
            sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
            
            // Redirect to guest payment page
            window.location.href = 'guest-payment.html';
        });
    }
    
    // Exchange link handling in main script
}

function closeGuestLoginModal() {
    if (guestLoginModal) {
        guestLoginModal.style.display = 'none';
    }
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
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    const user = storedUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        saveUserToStorage(user);
        updateAuthDisplay();
        closeLoginModal();
        closeGuestLoginModal();
        
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
    if (!authContainer) return;
    
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
    const slots = document.querySelectorAll('.time-slot');
    
    if (slots.length === 0) return;
    
    slots.forEach(slot => {
        // Remove existing listeners by cloning the element
        const newSlot = slot.cloneNode(true);
        slot.parentNode.replaceChild(newSlot, slot);
        
        // Add new click event listener
        newSlot.addEventListener('click', handleTimeSlotClick);
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

// Combined function for validation and toggling
function validateAndToggleSlot() {
    const courtId = parseInt(this.dataset.court);
    const date = this.dataset.date;
    const time = this.dataset.time;
    const isRushHour = this.dataset.rush === 'true';
    
    // Create a storage key for this date
    const dateKey = `selected_slots_${date}`;
    
    // Get or initialize the selection tracking for this date
    if (!localStorage.getItem(dateKey)) {
        localStorage.setItem(dateKey, JSON.stringify([]));
    }
    
    // Get the stored selections for this date
    let dateSelections = JSON.parse(localStorage.getItem(dateKey)) || [];
    
    if (this.classList.contains('available')) {
        // Select the slot
        this.classList.remove('available');
        this.classList.add('selected');
        
        // Add to selections
        const newSlot = {
            courtId,
            date,
            time,
            displayTime: formatDisplayTime(time),
            isRushHour
        };
        
        selectedSlots.push(newSlot);
        dateSelections.push(newSlot);
        
    } else if (this.classList.contains('selected')) {
        // Deselect the slot
        this.classList.remove('selected');
        this.classList.add('available');
        
        // Remove from selected slots
        const index = selectedSlots.findIndex(s => 
            s.courtId === courtId && 
            s.date === date && 
            s.time === time
        );
        
        if (index !== -1) {
            selectedSlots.splice(index, 1);
        }
        
        // Remove from date selections
        const dateIndex = dateSelections.findIndex(s => 
            s.courtId === courtId && 
            s.date === date && 
            s.time === time
        );
        
        if (dateIndex !== -1) {
            dateSelections.splice(dateIndex, 1);
        }
    }
    
    // Update localStorage
    localStorage.setItem(dateKey, JSON.stringify(dateSelections));
    
    // Update UI
    updateBookButtonState();
    updateSelectionSummary();
    validateBookingSelection();
}

function updateBookButtonState() {
    if (!bookButton) return;
    
    const isValid = validateBookingSelection();
    
    if (selectedSlots.length > 0 && isValid) {
        bookButton.classList.add('active');
    } else {
        bookButton.classList.remove('active');
    }
}

function updateSelectionSummary() {
    if (!selectionSummary || !selectedCount || !selectionDetails) return;
    
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

function validateBookingSelection() {
    if (!validationMessage || !selectionSummary) return false;
    
    if (selectedSlots.length === 0) {
        selectionSummary.classList.add('hidden');
        return false;
    }
    
    // Group selections by court and date (key format: courtId-date)
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
    const invalidSingleSlots = [];
    
    for (const [key, slots] of Object.entries(groupedByCourtDate)) {
        if (slots.length === 0) continue;
        
        // First, sort slots by time
        slots.sort((a, b) => {
            const [aHour, aMin] = a.time.split(':').map(Number);
            const [bHour, bMin] = b.time.split(':').map(Number);
            return (aHour * 60 + aMin) - (bHour * 60 + bMin);
        });
        
        // Find continuous chunks
        let currentChunk = [slots[0]];
        
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
                // Not adjacent, start new chunk
                if (currentChunk.length >= 2) {
                    validChunks.push([...currentChunk]);
                } else {
                    // This is a single slot, mark it
                    invalidSingleSlots.push(...currentChunk);
                }
                currentChunk = [currentSlot];
            }
        }
        
        // Add the final chunk
        if (currentChunk.length >= 2) {
            validChunks.push(currentChunk);
        } else {
            invalidSingleSlots.push(...currentChunk);
        }
    }
    
    // Validation criteria
    let isValid = true;
    let validationMessageText = "";
    
    if (validChunks.length === 0 && selectedSlots.length > 0) {
        isValid = false;
        validationMessageText = "Please select at least 2 adjacent time slots.";
    } else if (invalidSingleSlots.length > 0) {
        isValid = false;
        validationMessageText = "All selected slots must be part of groups of at least 2 adjacent slots.";
    } else if (validChunks.length > 1) {
        // Sort chunks by start time
        validChunks.sort((a, b) => {
            const [aHour, aMin] = a[0].time.split(':').map(Number);
            const [bHour, bMin] = b[0].time.split(':').map(Number);
            return (aHour * 60 + aMin) - (bHour * 60 + bMin);
        });
        
        // Check spacing between chunks on the same court and date
        for (let i = 1; i < validChunks.length; i++) {
            const prevChunkEnd = validChunks[i-1][validChunks[i-1].length - 1];
            const currentChunkStart = validChunks[i][0];
            
            // We only need to check chunks from the same court and date
            if (prevChunkEnd.courtId === currentChunkStart.courtId && 
                prevChunkEnd.date === currentChunkStart.date) {
                
                // Calculate time difference
                const [prevHour, prevMin] = prevChunkEnd.time.split(':').map(Number);
                const [currentHour, currentMin] = currentChunkStart.time.split(':').map(Number);
                
                const prevTimeInMin = prevHour * 60 + prevMin + 30; // Add 30 minutes for slot duration
                const currentTimeInMin = currentHour * 60 + currentMin;
                const timeDiff = currentTimeInMin - prevTimeInMin;
                
                // Must be at least 60 minutes apart (more than 1 time frame)
                if (timeDiff < 60) {
                    isValid = false;
                    validationMessageText = "Time groups on the same court and date must be at least 1 hour apart.";
                    break;
                }
            }
        }
    }
    
    // Update UI
    if (isValid) {
        validationMessage.textContent = selectedSlots.length > 0 ? "Selection valid for booking!" : "";
        validationMessage.className = "validation-message success";
        selectionSummary.className = "selection-summary valid";
        bookButton.classList.add('active');
    } else {
        validationMessage.textContent = validationMessageText;
        validationMessage.className = "validation-message error";
        selectionSummary.className = "selection-summary invalid";
        bookButton.classList.remove('active');
    }
    
    return isValid;
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
    if (!validateBookingSelection()) {
        return;
    }
    
    sessionStorage.setItem('selectedSlots', JSON.stringify(selectedSlots));
    
    if (currentUser) {
        window.location.href = 'payment.html';
    } else {
        // Not logged in, show guest login modal
        if (guestLoginModal) {
            guestLoginModal.style.display = 'flex';
        } else {
            // Fallback to regular login modal
            loginModal.style.display = 'flex';
        }
    }
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
window.selectedSlots = selectedSlots;
window.formatDisplayTime = formatDisplayTime;
window.validateAndToggleSlot = validateAndToggleSlot;
window.updateBookButtonState = updateBookButtonState;
window.updateSelectionSummary = updateSelectionSummary;
window.validateBookingSelection = validateBookingSelection;

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);