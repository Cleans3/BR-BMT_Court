// DOM Elements
const authContainer = document.getElementById('authContainer');
const bookingsTable = document.getElementById('bookingsTable');
const courtsTable = document.getElementById('courtsTable');
const usersTable = document.getElementById('usersTable');
const bookingSearch = document.getElementById('bookingSearch');
const userSearch = document.getElementById('userSearch');
const totalBookingsValue = document.getElementById('totalBookingsValue');
const totalRevenueValue = document.getElementById('totalRevenueValue');
const activeUsersValue = document.getElementById('activeUsersValue');
const settingsForm = document.getElementById('settingsForm');
const navLinks = document.querySelectorAll('.sidebar-nav a');
const dashboardSections = document.querySelectorAll('.dashboard-section');

// Constants
const PRICE_PER_SLOT = 15.00; // $15 per 30-minute slot
const BOOKING_FEE = 2.00;     // $2 booking fee

// App State
let currentUser = null;
let users = [];
let bookings = [];
let courts = [];

// Initialize the dashboard
function initDashboard() {
    loadUserFromStorage();
    loadDataFromStorage();
    
    // Check if user is admin
    if (!currentUser || !currentUser.isAdmin) {
        alert('Access denied. Admins only.');
        window.location.href = '../index.html';
        return;
    }
    
    updateAuthDisplay();
    renderAllTables();
    updateReports();
    setupEventListeners();
}

function loadUserFromStorage() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
}

function loadDataFromStorage() {
    // Load users
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        users = [
            { id: 1, username: 'admint', password: 'minhbeo', name: 'Admin User', isAdmin: true },
            { id: 2, username: 'user1', password: 'password1', name: 'John Doe', isAdmin: false }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Load bookings
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
        bookings = JSON.parse(storedBookings);
    } else {
        bookings = [
            { id: 1, userId: 2, courtId: 1, date: '2025-03-04', time: '10:00' },
            { id: 2, userId: 2, courtId: 1, date: '2025-03-04', time: '10:30' },
            { id: 3, userId: 1, courtId: 3, date: '2025-03-05', time: '18:00' },
            { id: 4, userId: 1, courtId: 3, date: '2025-03-05', time: '18:30' }
        ];
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
    
    // Load or initialize courts
    courts = [
        { id: 1, name: "Court 1", isActive: true },
        { id: 2, name: "Court 2", isActive: true },
        { id: 3, name: "Court 3", isActive: true },
        { id: 4, name: "Court 4", isActive: true },
        { id: 5, name: "Court 5", isActive: true },
        { id: 6, name: "Court 6", isActive: true }
    ];
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
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Search functionality
    bookingSearch.addEventListener('input', filterBookings);
    userSearch.addEventListener('input', filterUsers);
    
    // Settings form
    settingsForm.addEventListener('submit', saveSettings);
}

function showSection(sectionId) {
    // Hide all sections
    dashboardSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(`${sectionId}-section`).style.display = 'block';
}

function renderAllTables() {
    renderBookingsTable();
    renderCourtsTable();
    renderUsersTable();
}

function renderBookingsTable() {
    let html = '';
    
    bookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown User' };
        const court = courts.find(c => c.id === booking.courtId) || { name: 'Unknown Court' };
        
        html += `
            <tr>
                <td>#${booking.id}</td>
                <td>${user.name}</td>
                <td>${court.name}</td>
                <td>${formatDisplayDate(booking.date)}</td>
                <td>${formatDisplayTime(booking.time)}</td>
                <td><span class="status-badge status-confirmed">Confirmed</span></td>
                <td class="action-buttons">
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                </td>
            </tr>
        `;
    });
    
    bookingsTable.innerHTML = html || '<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>';
}

function renderCourtsTable() {
    let html = '';
    
    courts.forEach(court => {
        html += `
            <tr>
                <td>${court.id}</td>
                <td>${court.name}</td>
                <td>${court.isActive ? 'Active' : 'Inactive'}</td>
                <td class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editCourt(${court.id})">Edit</button>
                    <button class="btn ${court.isActive ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleCourtStatus(${court.id})">
                        ${court.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `;
    });
    
    courtsTable.innerHTML = html;
}

function renderUsersTable() {
    let html = '';
    
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.isAdmin ? 'Admin' : 'Customer'}</td>
                <td class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editUser(${user.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    usersTable.innerHTML = html;
}

function updateReports() {
    // Total bookings count
    totalBookingsValue.textContent = bookings.length;
    
    // Calculate total revenue
    const revenue = bookings.length * (PRICE_PER_SLOT + BOOKING_FEE);
    totalRevenueValue.textContent = `$${revenue.toFixed(2)}`;
    
    // Active users count (excluding admin)
    const activeUsers = users.filter(user => !user.isAdmin).length;
    activeUsersValue.textContent = activeUsers;
}

function filterBookings() {
    const searchTerm = bookingSearch.value.toLowerCase();
    
    // Skip filtering if search term is empty
    if (!searchTerm) {
        renderBookingsTable();
        return;
    }
    
    const filteredBookings = bookings.filter(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown User' };
        const court = courts.find(c => c.id === booking.courtId) || { name: 'Unknown Court' };
        
        return (
            user.name.toLowerCase().includes(searchTerm) ||
            court.name.toLowerCase().includes(searchTerm) ||
            booking.date.includes(searchTerm) ||
            booking.time.includes(searchTerm)
        );
    });
    
    let html = '';
    
    filteredBookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown User' };
        const court = courts.find(c => c.id === booking.courtId) || { name: 'Unknown Court' };
        
        html += `
            <tr>
                <td>#${booking.id}</td>
                <td>${user.name}</td>
                <td>${court.name}</td>
                <td>${formatDisplayDate(booking.date)}</td>
                <td>${formatDisplayTime(booking.time)}</td>
                <td><span class="status-badge status-confirmed">Confirmed</span></td>
                <td class="action-buttons">
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                </td>
            </tr>
        `;
    });
    
    bookingsTable.innerHTML = html || '<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>';
}

function filterUsers() {
    const searchTerm = userSearch.value.toLowerCase();
    
    // Skip filtering if search term is empty
    if (!searchTerm) {
        renderUsersTable();
        return;
    }
    
    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
    );
    
    let html = '';
    
    filteredUsers.forEach(user => {
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${user.isAdmin ? 'Admin' : 'Customer'}</td>
                <td class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editUser(${user.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Delete</button>
                </td>
            </tr>
        `;
    });
    
    usersTable.innerHTML = html || '<tr><td colspan="5" style="text-align: center;">No users found</td></tr>';
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        // Remove booking from array
        bookings = bookings.filter(booking => booking.id !== bookingId);
        
        // Save to localStorage
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Update UI
        renderBookingsTable();
        updateReports();
        
        alert('Booking cancelled successfully');
    }
}

function toggleCourtStatus(courtId) {
    const court = courts.find(c => c.id === courtId);
    if (court) {
        court.isActive = !court.isActive;
        renderCourtsTable();
    }
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        const newName = prompt('Enter new name:', user.name);
        if (newName && newName.trim()) {
            user.name = newName.trim();
            
            // Save to localStorage
            localStorage.setItem('users', JSON.stringify(users));
            
            // Update UI
            renderUsersTable();
            
            alert('User updated successfully');
        }
    }
}

function deleteUser(userId) {
    // Don't allow deleting the current user
    if (userId === currentUser.id) {
        alert('You cannot delete your own account');
        return;
    }
    
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        // Remove user from array
        users = users.filter(user => user.id !== userId);
        
        // Also remove their bookings
        bookings = bookings.filter(booking => booking.userId !== userId);
        
        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Update UI
        renderUsersTable();
        renderBookingsTable();
        updateReports();
        
        alert('User deleted successfully');
    }
}

function saveSettings(e) {
    e.preventDefault();
    alert('Settings saved successfully');
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

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Define functions used in HTML event handlers
window.cancelBooking = cancelBooking;
window.toggleCourtStatus = toggleCourtStatus;
window.editUser = editUser;
window.deleteUser = deleteUser;