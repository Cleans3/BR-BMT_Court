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
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');
const notificationBadge = document.getElementById('notificationBadge');
const allNotificationsList = document.getElementById('allNotificationsList');

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
    
    // Force admin flag for 'admint' user
    if (currentUser && currentUser.username === 'admint') {
        currentUser.isAdmin = true;
        // Re-save to storage to ensure persistence
        const userToSave = { ...currentUser };
        delete userToSave.password;
        localStorage.setItem('currentUser', JSON.stringify(userToSave));
    }
    
    loadDataFromStorage();
    
    // Double check if user is admin - essential for security
    if (!currentUser || !isAdmin()) {
        alert('Access denied. Admins only.');
        window.location.href = '../index.html';
        return;
    }
    
    updateAuthDisplay();
    loadNotifications();
    renderAllTables();
    updateReports();
    setupEventListeners();
    
    // Show the default section (bookings)
    showSection('bookings');
}

// Very strict admin check
function isAdmin() {
    if (currentUser && currentUser.username === 'admint') {
        currentUser.isAdmin = true;
        return true;
    }
    return currentUser && currentUser.isAdmin === true;
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
            const isGuest = notification.isGuest ? 'guest-notification' : '';
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            
            html += `
                <li class="notification-item ${isUnread} ${isGuest}" data-id="${notification.id}">
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
    if (bookingSearch) {
        bookingSearch.addEventListener('input', filterBookings);
    }
    
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    // Settings form
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }
    
    // Notification dropdown toggle
    document.getElementById('notificationToggle').addEventListener('click', toggleNotifications);
    
    // Mark all notifications as read
    document.getElementById('markAllRead').addEventListener('click', markAllNotificationsAsRead);
    
    // Clear all notifications
    const clearAllBtn = document.getElementById('clearAllNotifications');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllNotifications);
    }
    
    // Notification filter buttons
    const filterButtons = document.querySelectorAll('.notification-filters button');
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                filterNotifications(filter);
                
                // Update active class
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

// Add Court button functionality
document.addEventListener('DOMContentLoaded', function() {
    const addCourtBtn = document.getElementById('addCourtBtn');
    if (addCourtBtn) {
        addCourtBtn.addEventListener('click', addNewCourt);
    }
});
// Add these fixes after document.addEventListener('DOMContentLoaded', initDashboard);

// Make sure the navigation links in the sidebar work correctly
function fixSidebarNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the section to show
            const sectionId = this.getAttribute('data-section');
            
            // Hide all sections
            const sections = document.querySelectorAll('.dashboard-section');
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected section
            const selectedSection = document.getElementById(sectionId + '-section');
            if (selectedSection) {
                selectedSection.style.display = 'block';
            }
            
            // Update active class
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
}

// Load saved price settings on page load
function loadSavedPriceSettings() {
    const storedSettings = localStorage.getItem('pricingSettings');
    if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        
        const courtPriceInput = document.getElementById('courtPrice');
        const rushHourPriceInput = document.getElementById('rushHourPrice');
        const bookingFeeInput = document.getElementById('bookingFee');
        
        if (courtPriceInput && settings.normalHourPrice) {
            courtPriceInput.value = settings.normalHourPrice;
        }
        
        if (rushHourPriceInput && settings.rushHourPrice) {
            rushHourPriceInput.value = settings.rushHourPrice;
        }
        
        if (bookingFeeInput && settings.bookingFee) {
            bookingFeeInput.value = settings.bookingFee;
        }
    }
}

// Handle settings form submission
function setupSettingsForm() {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const courtPrice = parseFloat(document.getElementById('courtPrice').value);
            const rushHourPrice = parseFloat(document.getElementById('rushHourPrice').value);
            const bookingFee = parseFloat(document.getElementById('bookingFee').value);
            
            // Validate inputs
            if (isNaN(courtPrice) || isNaN(rushHourPrice) || isNaN(bookingFee)) {
                alert('Please enter valid numbers for all prices');
                return;
            }
            
            // Save settings
            const settings = {
                normalHourPrice: courtPrice,
                rushHourPrice: rushHourPrice,
                bookingFee: bookingFee
            };
            
            localStorage.setItem('pricingSettings', JSON.stringify(settings));
            
            alert('Settings saved successfully!');
        });
    }
}

// Add event listener to run after the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    fixSidebarNavigation();
    loadSavedPriceSettings();
    setupSettingsForm();
    
    // Fix for notification dropdown toggle
    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) {
        notificationToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.getElementById('notificationDropdown');
            dropdown.classList.toggle('show');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.classList.contains('show') && !e.target.closest('.notification-container')) {
            dropdown.classList.remove('show');
        }
    });
});
function addNewCourt() {
    const courtName = prompt('Enter court name:');
    if (courtName && courtName.trim()) {
        const newId = courts.length > 0 ? Math.max(...courts.map(c => c.id)) + 1 : 1;
        courts.push({
            id: newId,
            name: courtName.trim(),
            isActive: true
        });
        
        renderCourtsTable();
        alert('Court added successfully!');
    }
}

function clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        notifications = [];
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        updateNotificationCount();
        renderNotifications();
        renderAllNotificationsList();
    }
}

function filterNotifications(filter) {
    if (!allNotificationsList) return;
    
    const items = allNotificationsList.querySelectorAll('.notification-item-large');
    
    items.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'block';
        } else if (filter === 'unread') {
            if (item.classList.contains('unread')) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        } else if (filter === 'read') {
            if (!item.classList.contains('unread')) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        }
    });
}

function showSection(sectionId) {
    // Hide all sections
    dashboardSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const sectionElement = document.getElementById(`${sectionId}-section`);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
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
        renderAllNotificationsList();
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
    renderAllNotificationsList();
    
    // Close the dropdown
    document.getElementById('notificationDropdown').classList.remove('show');
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

function renderAllTables() {
    renderBookingsTable();
    renderCourtsTable();
    renderUsersTable();
    renderAllNotificationsList();
}

function renderAllNotificationsList() {
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
            const isGuest = notification.isGuest ? 'guest-notification' : '';
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            const formattedDate = new Date(notification.createdAt).toLocaleString();
            
            html += `
                <div class="notification-item-large ${isUnread} ${isGuest}" data-id="${notification.id}">
                    <div class="notification-header">
                        <div class="notification-title-container">
                            <span class="notification-title">${notification.title}</span>
                            ${!notification.isRead ? '<span class="unread-badge">Unread</span>' : ''}
                            ${notification.isGuest ? '<span class="guest-badge">Guest</span>' : ''}
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
        
        // Highlight the booking row or scroll to it
        setTimeout(() => {
            const bookingRow = document.querySelector(`#bookingsTable tr:nth-child(${bookingId})`);
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
    if (!bookingsTable) return;
    
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

function renderCourtsTable() {
    if (!courtsTable) return;
    
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
    if (!usersTable) return;
    
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
    if (!totalBookingsValue || !totalRevenueValue || !activeUsersValue) return;
    
    // Total bookings count
    totalBookingsValue.textContent = bookings.length;
    
    // Calculate total revenue
    const revenue = bookings.length * (PRICE_PER_SLOT + BOOKING_FEE);
    totalRevenueValue.textContent = `$${revenue.toFixed(2)}`;
    
    // Active users count (excluding admin)
    const activeUsers = users.filter(user => !user.isAdmin).length;
    activeUsersValue.textContent = activeUsers;
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

function editCourt(courtId) {
    const court = courts.find(c => c.id === courtId);
    if (court) {
        const newName = prompt('Enter new court name:', court.name);
        if (newName && newName.trim()) {
            court.name = newName.trim();
            renderCourtsTable();
        }
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
            booking.time.includes(searchTerm) ||
            booking.status.toLowerCase().includes(searchTerm)
        );
    });
    
    let html = '';
    
    filteredBookings.forEach(booking => {
        const user = users.find(u => u.id === booking.userId) || { name: 'Unknown User' };
        const court = courts.find(c => c.id === booking.courtId) || { name: 'Unknown Court' };
        
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

function saveSettings(e) {
    e.preventDefault();
    
    // Get settings values
    const courtPrice = document.getElementById('courtPrice').value;
    const bookingFee = document.getElementById('bookingFee').value;
    const rushHourPrice = document.getElementById('rushHourPrice').value;
    
    // Validate input
    if (isNaN(courtPrice) || isNaN(bookingFee) || isNaN(rushHourPrice)) {
        alert('Please enter valid numbers for prices');
        return;
    }
    
    // Save to localStorage
    const settings = {
        courtPrice: parseFloat(courtPrice),
        bookingFee: parseFloat(bookingFee),
        rushHourPrice: parseFloat(rushHourPrice)
    };
    
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    
    // Update UI constants
    // Don't update PRICE_PER_SLOT and BOOKING_FEE here as they're used in calculations
    
    alert('Settings saved successfully!');
}