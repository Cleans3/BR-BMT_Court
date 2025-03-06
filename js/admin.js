function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    // Update count display
    if (notificationCount) {
        notificationCount.textContent = unreadCount;
    }
    
    // Show/hide badge
    if (notificationBadge) {
        if (unreadCount > 0) {
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

function renderNotifications() {
    if (!notificationsList) return;
    
    let html = '';
    
    if (notifications.length === 0) {
        html = '<li class="notification-item empty">No notifications</li>';
    } else {
        // Sort by creation date (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Take only the 5 most recent ones
        const recentNotifications = sortedNotifications.slice(0, 5);
        
        recentNotifications.forEach(notification => {
            const isUnread = !notification.isRead ? 'unread' : '';
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            
            html += `
                <li class="notification-item ${isUnread}" data-id="${notification.id}">
                    <div class="notification-header">
                        <span class="notification-title">${notification.title}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <div class="notification-content">${notification.message}</div>
                    ${notification.detailedMessage ? 
                        `<div class="notification-details">${notification.detailedMessage}</div>` : ''}
                    <div class="notification-actions">
                        <button class="btn-mark-read" onclick="markNotificationAsRead(${notification.id})">
                            Mark as ${notification.isRead ? 'unread' : 'read'}
                        </button>
                    </div>
                </li>
            `;
        });
        
        // Add a "View All" link if there are more than 5 notifications
        if (notifications.length > 5) {
            html += `
                <li class="notification-item view-all">
                    <a href="#" data-section="notifications" onclick="showAllNotifications(event)">
                        View all ${notifications.length} notifications
                    </a>
                </li>
            `;
        }
    }
    
    notificationsList.innerHTML = html;
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
}

function markNotificationAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = !notification.isRead;
        
        // Save to localStorage
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        // Update UI
        updateNotificationCount();
        renderNotifications();
    }
}

function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.isRead = true;
    });
    
    // Save to localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    
    // Update UI
    updateNotificationCount();
    renderNotifications();
}

function showAllNotifications(event) {
    event.preventDefault();
    
    // Show the notifications section
    showSection('notifications');
    
    // Update active nav link
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === 'notifications') {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
    
    // Close dropdown
    document.getElementById('notificationDropdown').classList.remove('show');
}

// Helper function to display time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}function setupEventListeners() {
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
    
    // Notification dropdown toggle
    document.getElementById('notificationToggle').addEventListener('click', toggleNotifications);
    
    // Mark all notifications as read
    document.getElementById('markAllRead').addEventListener('click', markAllNotificationsAsRead);
}// DOM Elements
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
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');
const notificationBadge = document.getElementById('notificationBadge');

// Constants
const PRICE_PER_SLOT = 15.00; // $15 per 30-minute slot
const BOOKING_FEE = 2.00;     // $2 booking fee

// App State
let currentUser = null;
let users = [];
let bookings = [];
let courts = [];
let notifications = [];

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
    loadNotifications();
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
            { id: 1, userId: 2, userName: 'John Doe', courtId: 1, courtName: 'Court 1', date: '2025-03-04', time: '10:00', status: 'confirmed', createdAt: '2025-03-01T10:00:00Z' },
            { id: 2, userId: 2, userName: 'John Doe', courtId: 1, courtName: 'Court 1', date: '2025-03-04', time: '10:30', status: 'confirmed', createdAt: '2025-03-01T10:00:00Z' },
            { id: 3, userId: 1, userName: 'Admin User', courtId: 3, courtName: 'Court 3', date: '2025-03-05', time: '18:00', status: 'confirmed', createdAt: '2025-03-01T11:00:00Z' },
            { id: 4, userId: 1, userName: 'Admin User', courtId: 3, courtName: 'Court 3', date: '2025-03-05', time: '18:30', status: 'confirmed', createdAt: '2025-03-01T11:00:00Z' }
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

function loadNotifications() {
    // Load notifications from localStorage
    const storedNotifications = localStorage.getItem('adminNotifications');
    if (storedNotifications) {
        notifications = JSON.parse(storedNotifications);
    } else {
        notifications = [];
    }
    
    // Update notification count
    updateNotificationCount();
    
    // Render notifications in the dropdown
    renderNotifications();
}

function updateAuthDisplay() {
    if (currentUser) {
        authContainer.innerHTML = `
            <div class="user-info">
                <span class="user-name">Admin: ${currentUser.name}</span>
            </div>
            <a href="../index.html" class="btn btn-primary">Back to Site</a>
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
    renderAllNotificationsList();
}

function renderAllNotificationsList() {
    const allNotificationsList = document.getElementById('allNotificationsList');
    if (!allNotificationsList) return;
    
    let html = '';
    
    if (notifications.length === 0) {
        html = '<div class="empty-state">No notifications</div>';
    } else {
        // Sort by creation date (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        sortedNotifications.forEach(notification => {
            const isUnread = !notification.isRead ? 'unread' : '';
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            const formattedDate = new Date(notification.createdAt).toLocaleString();
            
            html += `
                <div class="notification-item-large ${isUnread}" data-id="${notification.id}">
                    <div class="notification-header">
                        <div class="notification-title-container">
                            <span class="notification-title">${notification.title}</span>
                            ${!notification.isRead ? '<span class="unread-badge">Unread</span>' : ''}
                        </div>
                        <span class="notification-time" title="${formattedDate}">${timeAgo}</span>
                    </div>
                    <div class="notification-content">${notification.message}</div>
                    ${notification.detailedMessage ? 
                        `<div class="notification-details">${notification.detailedMessage}</div>` : ''}
                    <div class="notification-actions">
                        <button class="btn btn-sm btn-primary" onclick="markNotificationAsRead(${notification.id})">
                            Mark as ${notification.isRead ? 'unread' : 'read'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notification.id})">
                            Delete
                        </button>
                        ${notification.type === 'new_booking' ? 
                            `<button class="btn btn-sm btn-success" onclick="viewBookingDetails(${notification.bookingIds[0]})">
                                View Booking
                            </button>` 
                            : ''}
                    </div>
                </div>
            `;
        });
    }
    
    allNotificationsList.innerHTML = html;
}

function deleteNotification(notificationId) {
    if (confirm('Are you sure you want to delete this notification?')) {
        // Remove from array
        notifications = notifications.filter(n => n.id !== notificationId);
        
        // Save to localStorage
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        // Update UI
        updateNotificationCount();
        renderNotifications();
        renderAllNotificationsList();
    }
}

function viewBookingDetails(bookingId) {
    // Find the booking
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        // Show the bookings section
        showSection('bookings');
        
        // Update active nav link
        navLinks.forEach(link => {
            if (link.getAttribute('data-section') === 'bookings') {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
        
        // Highlight the booking row
        setTimeout(() => {
            const bookingRow = document.querySelector(`#bookingsTable tr td:first-child:contains('#${bookingId}')`).parentNode;
            if (bookingRow) {
                bookingRow.classList.add('highlighted-row');
                bookingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    bookingRow.classList.remove('highlighted-row');
                }, 3000);
            }
        }, 300);
    }
}

function renderBookingsTable() {
    let html = '';
    
    bookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: booking.userName || 'Unknown User' };
        const court = courts.find(c => c.id === booking.courtId) || { name: booking.courtName || 'Unknown Court' };
        
        // Status badge class based on booking status
        let statusClass = '';
        switch(booking.status) {
            case 'pending':
                statusClass = 'status-pending';
                break;
            case 'confirmed':
                statusClass = 'status-confirmed';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                break;
            default:
                statusClass = 'status-pending';
        }
        
        html += `
            <tr>
                <td>#${booking.id}</td>
                <td>${user.name}</td>
                <td>${court.name}</td>
                <td>${formatDisplayDate(booking.date)}</td>
                <td>${formatDisplayTime(booking.time)}</td>
                <td><span class="status-badge ${statusClass}">${booking.status || 'pending'}</span></td>
                <td class="action-buttons">
                    ${booking.status !== 'confirmed' ? 
                        `<button class="btn btn-success btn-sm" onclick="confirmBookingById(${booking.id})">Confirm</button>` : ''}
                    ${booking.status !== 'cancelled' ? 
                        `<button class="btn btn-danger btn-sm" onclick="cancelBookingById(${booking.id})">Cancel</button>` : ''}
                    <button class="btn btn-primary btn-sm" onclick="editBookingById(${booking.id})">Edit</button>
                </td>
            </tr>
        `;
    });
    
    bookingsTable.innerHTML = html || '<tr><td colspan="7" style="text-align: center;">No bookings found</td></tr>';
}

function confirmBookingById(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'confirmed';
        
        // Save to localStorage
        localStorage.setItem('bookings', JSON.stringify(bookings));
        
        // Update UI
        renderBookingsTable();
        
        alert('Booking confirmed successfully');
    }
}

function cancelBookingById(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            
            // Save to localStorage
            localStorage.setItem('bookings', JSON.stringify(bookings));
            
            // Update UI
            renderBookingsTable();
            updateReports();
            
            alert('Booking cancelled successfully');
        }
    }
}

function editBookingById(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        // Create a simple form for editing the booking
        const newTime = prompt('Enter new time (format: HH:MM):', booking.time);
        if (newTime && /^\d{1,2}:\d{2}$/.test(newTime)) {
            booking.time = newTime;
            
            // Save to localStorage
            localStorage.setItem('bookings', JSON.stringify(bookings));
            
            // Update UI
            renderBookingsTable();
            
            alert('Booking updated successfully');
        } else if (newTime) {
            alert('Invalid time format. Please use HH:MM format.');
        }
    }
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
window.cancelBookingById = cancelBookingById;
window.confirmBookingById = confirmBookingById;
window.editBookingById = editBookingById;
window.toggleCourtStatus = toggleCourtStatus;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.markNotificationAsRead = markNotificationAsRead;
window.deleteNotification = deleteNotification;
window.viewBookingDetails = viewBookingDetails;