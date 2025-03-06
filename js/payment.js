// Check if user is admin
function isUserAdmin() {
    return currentUser && currentUser.isAdmin === true;
}// DOM Elements
const bookingSummaryTable = document.getElementById('bookingSummaryTable');
const subtotalPrice = document.getElementById('subtotalPrice');
const bookingFee = document.getElementById('bookingFee');
const totalPrice = document.getElementById('totalPrice');
const backButton = document.getElementById('backButton');
const confirmButton = document.getElementById('confirmButton');
const authContainer = document.getElementById('authContainer');

// Constants
const PRICE_PER_SLOT = 15.00; // $15 per 30-minute slot
const BOOKING_FEE = 2.00;     // $2 booking fee

// App State
let currentUser = null;
let selectedSlots = [];
let bookings = [];

// Additional DOM Elements
const returnHomeButton = document.getElementById('returnHomeButton');

// Initialize the page
function initPaymentPage() {
    loadUserFromStorage();
    loadBookingsFromStorage();
    updateAuthDisplay();
    
    // Load selected slots from session storage
    const storedSlots = sessionStorage.getItem('selectedSlots');
    if (storedSlots) {
        selectedSlots = JSON.parse(storedSlots);
        renderBookingSummary();
    } else {
        // No slots selected, redirect back to home
        alert('No booking slots selected. Redirecting to home page.');
        window.location.href = 'index.html';
    }
    
    // Set up event listeners
    backButton.addEventListener('click', navigateBackToHome);
    confirmButton.addEventListener('click', confirmBooking);
    returnHomeButton.addEventListener('click', navigateBackToHome);
}

// Check if user is admin
function isUserAdmin() {
    return currentUser && currentUser.isAdmin === true;
}

function loadUserFromStorage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else {
        // Not logged in, redirect to login
        alert('Please log in to complete your booking.');
        window.location.href = 'index.html';
    }
}

function loadBookingsFromStorage() {
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
        bookings = JSON.parse(storedBookings);
    } else {
        // Initialize with sample bookings
        bookings = [
            { id: 1, userId: 2, courtId: 1, date: '2025-03-04', time: '10:00' },
            { id: 2, userId: 2, courtId: 1, date: '2025-03-04', time: '10:30' },
            { id: 3, userId: 1, courtId: 3, date: '2025-03-05', time: '18:00' },
            { id: 4, userId: 1, courtId: 3, date: '2025-03-05', time: '18:30' }
        ];
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
}

function updateAuthDisplay() {
    if (currentUser) {
        // Different display for admin vs regular user
        if (isUserAdmin()) {
            authContainer.innerHTML = `
                <div class="user-info">
                    <span class="user-name">Admin: ${currentUser.name}</span>
                </div>
                <a href="admin/dashboard.html" class="btn admin-btn">Admin Panel</a>
                <button class="btn btn-danger" id="logoutBtn">Logout</button>
            `;
        } else {
            authContainer.innerHTML = `
                <div class="user-info">
                    <span class="user-name">Welcome, ${currentUser.name}</span>
                </div>
                <button class="btn btn-danger" id="logoutBtn">Logout</button>
            `;
        }
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        authContainer.innerHTML = `
            <button class="btn btn-primary login-btn" id="loginBtn">Login</button>
        `;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    // Redirect to home after logout
    window.location.href = 'index.html';
}

function renderBookingSummary() {
    let tableHtml = '';
    let subtotal = 0;
    
    // Group by court and date
    const groupedSlots = {};
    
    selectedSlots.forEach(slot => {
        const key = `Court ${slot.courtId}-${slot.date}`;
        if (!groupedSlots[key]) {
            groupedSlots[key] = [];
        }
        groupedSlots[key].push(slot);
    });
    
    // Generate table rows
    for (const [key, slots] of Object.entries(groupedSlots)) {
        const [courtName, date] = key.split('-');
        
        slots.forEach(slot => {
            const displayDate = formatDisplayDate(slot.date);
            tableHtml += `
                <tr>
                    <td>${courtName}</td>
                    <td>${displayDate}</td>
                    <td>${slot.displayTime || formatDisplayTime(slot.time)}</td>
                    <td>$${PRICE_PER_SLOT.toFixed(2)}</td>
                </tr>
            `;
            
            subtotal += PRICE_PER_SLOT;
        });
    }
    
    bookingSummaryTable.innerHTML = tableHtml;
    
    // Update price summary
    subtotalPrice.textContent = `$${subtotal.toFixed(2)}`;
    bookingFee.textContent = `$${BOOKING_FEE.toFixed(2)}`;
    const total = subtotal + BOOKING_FEE;
    totalPrice.textContent = `$${total.toFixed(2)}`;
}

function navigateBackToHome() {
    window.location.href = 'index.html';
}

function confirmBooking() {
    if (!currentUser) {
        alert('Please log in to confirm your booking.');
        return;
    }
    
    // Generate new booking IDs
    let nextBookingId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    
    const now = new Date();
    const timestamp = now.toISOString();
    
    // Create booking entries
    const newBookings = selectedSlots.map(slot => {
        return {
            id: nextBookingId++,
            userId: currentUser.id,
            userName: currentUser.name,
            courtId: slot.courtId,
            courtName: `Court ${slot.courtId}`,
            date: slot.date,
            time: slot.time,
            status: 'pending',
            createdAt: timestamp
        };
    });
    
    // Add to bookings
    bookings = [...bookings, ...newBookings];
    
    // Save to localStorage
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Create notification for admin
    createAdminNotification(newBookings);
    
    // Clear session storage for selected slots to prevent duplicate bookings
    sessionStorage.removeItem('selectedSlots');
    
    // Update UI to show confirmation message, but don't redirect
    document.getElementById('confirmationStep').classList.remove('hidden');
    document.getElementById('bookingStep').classList.add('hidden');
    
    // Update the confirmation details
    const confirmationDetails = document.getElementById('confirmationDetails');
    const totalBookedSlots = newBookings.length;
    const firstSlot = newBookings[0];
    
    confirmationDetails.innerHTML = `
        <p>You've successfully booked <strong>${totalBookedSlots}</strong> slots!</p>
        <p>Your booking reference number: <strong>REF-${firstSlot.id}</strong></p>
        <p>Please call <strong>0383533171</strong> to confirm your payment.</p>
        <p>Your booking will be held for 1 hour pending payment confirmation.</p>
    `;
}

function createAdminNotification(newBookings) {
    // Get existing notifications or initialize empty array
    const notifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    
    // Group bookings by court and date for a cleaner notification
    const booking = newBookings[0]; // Get the first booking for basic info
    
    const notification = {
        id: Date.now(), // Use timestamp as ID
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'new_booking',
        title: 'New Booking',
        message: `${currentUser.name} has booked ${newBookings.length} slot(s) starting on ${formatDisplayDate(booking.date)} at ${formatDisplayTime(booking.time)}`,
        bookingIds: newBookings.map(b => b.id),
        createdAt: new Date().toISOString(),
        isRead: false
    };
    
    // Add to beginning of array (newest first)
    notifications.unshift(notification);
    
    // Store in localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
}

// Helper functions
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

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initPaymentPage);