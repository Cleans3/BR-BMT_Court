// DOM Elements
const bookingSummaryTable = document.getElementById('bookingSummaryTable');
const subtotalPrice = document.getElementById('subtotalPrice');
const bookingFee = document.getElementById('bookingFee');
const totalPrice = document.getElementById('totalPrice');
const backButton = document.getElementById('backButton');
const confirmButton = document.getElementById('confirmButton');
const returnHomeButton = document.getElementById('returnHomeButton');
const bookingStep = document.getElementById('bookingStep');
const confirmationStep = document.getElementById('confirmationStep');
const confirmationDetails = document.getElementById('confirmationDetails');
const authContainer = document.getElementById('authContainer');

// Constants
const NORMAL_PRICE_PER_SLOT = 15.00; // $15 per 30-minute slot for normal hours
const RUSH_PRICE_PER_SLOT = 20.00; // $20 per 30-minute slot for rush hours
const BOOKING_FEE = 2.00;     // $2 booking fee

// App State
let currentUser = null;
let selectedSlots = [];
let bookings = [];

// Initialize the page
function initPaymentPage() {
    // Load user from storage
    loadUserFromStorage();
    
    // Update auth display
    updateAuthDisplay();
    
    // Load bookings from storage
    loadBookingsFromStorage();
    
    // Load selected slots
    loadSelectedSlots();
    
    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    if (backButton) {
        backButton.addEventListener('click', navigateBackToHome);
    }
    
    if (confirmButton) {
        confirmButton.addEventListener('click', confirmBooking);
    }
    
    if (returnHomeButton) {
        returnHomeButton.addEventListener('click', navigateBackToHome);
    }
}

function loadUserFromStorage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    } else {
        // Not logged in, redirect to login
        alert('You need to be logged in to access this page. Redirecting to home page.');
        window.location.href = 'index.html';
    }
}

function loadBookingsFromStorage() {
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
        bookings = JSON.parse(storedBookings);
    } else {
        // Initialize with empty bookings
        bookings = [];
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
}

function loadSelectedSlots() {
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
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    } else {
        authContainer.innerHTML = `
            <button class="btn btn-primary login-btn" id="loginBtn">Login</button>
        `;
        
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function renderBookingSummary() {
    if (!bookingSummaryTable || !subtotalPrice || !bookingFee || !totalPrice) return;
    
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
            const slotPrice = slot.isRushHour ? RUSH_PRICE_PER_SLOT : NORMAL_PRICE_PER_SLOT;
            
            tableHtml += `
                <tr>
                    <td>${courtName}</td>
                    <td>${displayDate}</td>
                    <td>${slot.displayTime || formatDisplayTime(slot.time)} ${slot.isRushHour ? '<span style="color:#fdcb6e">★</span>' : ''}</td>
                    <td>$${slotPrice.toFixed(2)}</td>
                </tr>
            `;
            
            subtotal += slotPrice;
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
        alert('You need to be logged in to confirm a booking.');
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
            courtName: determineCourtName(slot.courtId),
            date: slot.date,
            time: slot.time,
            status: 'pending',
            isRushHour: slot.isRushHour,
            price: slot.isRushHour ? RUSH_PRICE_PER_SLOT : NORMAL_PRICE_PER_SLOT,
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
    
    // Show confirmation step and hide booking step
    if (confirmationStep && bookingStep) {
        confirmationStep.classList.remove('hidden');
        bookingStep.classList.add('hidden');
    }
    
    // Update the confirmation details
    updateConfirmationDetails(newBookings);
}

function updateConfirmationDetails(newBookings) {
    if (!confirmationDetails) return;
    
    const totalBookedSlots = newBookings.length;
    const subtotal = newBookings.reduce((sum, booking) => sum + booking.price, 0);
    const total = subtotal + BOOKING_FEE;
    const firstBooking = newBookings[0];
    
    confirmationDetails.innerHTML = `
        <p><strong>Customer:</strong> ${currentUser.name}</p>
        <p><strong>Booking Reference:</strong> REF-${firstBooking.id}</p>
        <p><strong>Slots Booked:</strong> ${totalBookedSlots}</p>
        <p><strong>Total Amount:</strong> ${total.toFixed(2)}</p>
        <p>Your booking has been created successfully! Please call <strong>0383533171</strong> to confirm payment.</p>
        <p>Your booking will be held for 1 hour pending payment confirmation.</p>
    `;
}

function createAdminNotification(newBookings) {
    // Get existing notifications or initialize empty array
    const notifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    
    // Group bookings by date for a cleaner notification
    const groupedBookings = {};
    
    newBookings.forEach(booking => {
        if (!groupedBookings[booking.date]) {
            groupedBookings[booking.date] = {
                courts: [],
                times: []
            };
        }
        
        if (!groupedBookings[booking.date].courts.includes(booking.courtName || `Court ${booking.courtId}`)) {
            groupedBookings[booking.date].courts.push(booking.courtName || `Court ${booking.courtId}`);
        }
        
        groupedBookings[booking.date].times.push(
            `${formatDisplayTime(booking.time)}${booking.isRushHour ? ' (Rush)' : ''}`
        );
    });
    
    const notification = {
        id: Date.now(), // Use timestamp as ID
        userId: currentUser.id,
        userName: currentUser.name,
        type: 'new_booking',
        title: 'New Booking',
        message: `${currentUser.name} has booked ${newBookings.length} slots`,
        detailedMessage: createDetailedBookingMessage(groupedBookings),
        bookingIds: newBookings.map(b => b.id),
        createdAt: new Date().toISOString(),
        isRead: false
    };
    
    // Add to beginning of array (newest first)
    notifications.unshift(notification);
    
    // Store in localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
}

function createDetailedBookingMessage(groupedBookings) {
    let message = '<div class="booking-summary-table">';
    message += '<table><thead><tr><th>Date</th><th>Courts</th><th>Times</th></tr></thead><tbody>';
    
    for (const [date, details] of Object.entries(groupedBookings)) {
        message += `<tr>
            <td>${formatDisplayDate(date)}</td>
            <td>${details.courts.join(', ')}</td>
            <td>${details.times.join(', ')}</td>
        </tr>`;
    }
    
    message += '</tbody></table></div>';
    return message;
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

function determineCourtName(courtId) {
    if (courtId <= 6) {
        return `Lizunex Court ${courtId}`;
    } else {
        return `VNBC Court ${courtId - 6}`;
    }
}

// Call init when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initPaymentPage);