# Implementation Guide for Badminton Court Booking System

This guide provides detailed instructions for implementing the Badminton Court Booking system, including setup, configuration, and deployment steps.

## Prerequisites

- Web server with PHP 7.4+ support
- MySQL or PostgreSQL database
- Basic knowledge of HTML, CSS, JavaScript, and backend development
- Domain name (for production deployment)
- SSL certificate (for secure HTTPS connections)

## System Setup

### 1. File Structure

```
badminton-booking/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── includes/
│   ├── config.php
│   ├── db.php
│   ├── auth.php
│   └── functions.php
├── admin/
│   ├── dashboard.php
│   ├── bookings.php
│   └── users.php
├── index.php
├── login.php
├── register.php
├── booking.php
└── payment.php
```

### 2. Database Setup

1. Create a new database for the application
2. Execute the SQL script provided in the `database-schema.sql` file
3. Configure database connection in `includes/config.php`:

```php
<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'badminton_booking');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Application settings
define('APP_NAME', 'Badminton Court Booking');
define('APP_URL', 'https://yourdomain.com');
define('APP_EMAIL', 'contact@yourdomain.com');

// Session settings
session_start();
?>
```

## Core Functionality Implementation

### 1. User Authentication

The authentication system uses phone numbers instead of traditional username/email. Implement this in `includes/auth.php`:

```php
<?php
require_once 'config.php';
require_once 'db.php';

/**
 * Authenticate user by phone number
 * 
 * @param string $phone User's phone number
 * @param string $password User's password
 * @param string $userType 'customer' or 'employee'
 * @return array|bool User data if authenticated, false otherwise
 */
function authenticateUser($phone, $password, $userType = 'customer') {
    global $conn;
    
    $table = ($userType == 'employee') ? 'employees' : 'users';
    $idField = ($userType == 'employee') ? 'employee_id' : 'user_id';
    
    $stmt = $conn->prepare("SELECT * FROM $table WHERE phone_number = ?");
    $stmt->bind_param("s", $phone);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // In a real implementation, you would verify password hash
        // For demo purposes, we're just returning the user
        
        // Update last login time
        $updateStmt = $conn->prepare("UPDATE $table SET last_login = NOW() WHERE $idField = ?");
        $updateStmt->bind_param("i", $user[$idField]);
        $updateStmt->execute();
        
        return $user;
    }
    
    return false;
}

/**
 * Register a new customer
 * 
 * @param string $phone User's phone number
 * @param string $name User's name
 * @param string $email User's email (optional)
 * @param string $password User's password
 * @return array|bool New user data if registered, false otherwise
 */
function registerUser($phone, $name, $email, $password) {
    global $conn;
    
    // Check if phone number already exists
    $stmt = $conn->prepare("SELECT * FROM users WHERE phone_number = ?");
    $stmt->bind_param("s", $phone);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        return false; // Phone number already registered
    }
    
    // Insert new user
    $stmt = $conn->prepare("INSERT INTO users (phone_number, name, email) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $phone, $name, $email);
    
    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        return getUserById($userId);
    }
    
    return false;
}

/**
 * Get user by ID
 * 
 * @param int $userId User ID
 * @param string $userType 'customer' or 'employee'
 * @return array|bool User data if found, false otherwise
 */
function getUserById($userId, $userType = 'customer') {
    global $conn;
    
    $table = ($userType == 'employee') ? 'employees' : 'users';
    $idField = ($userType == 'employee') ? 'employee_id' : 'user_id';
    
    $stmt = $conn->prepare("SELECT * FROM $table WHERE $idField = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        return $result->fetch_assoc();
    }
    
    return false;
}
?>
```

### 2. Booking System

Implement the core booking functionality in `includes/functions.php`:

```php
<?php
require_once 'config.php';
require_once 'db.php';

/**
 * Get available time slots for a specific court and date
 * 
 * @param int $courtId Court ID
 * @param string $date Date in YYYY-MM-DD format
 * @return array Available time slots
 */
function getAvailableTimeSlots($courtId, $date) {
    global $conn;
    
    // Get all time slots
    $allSlots = [];
    $stmt = $conn->prepare("SELECT * FROM time_slots ORDER BY start_time");
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $allSlots[] = $row;
    }
    
    // Get booked slots
    $bookedSlots = [];
    $stmt = $conn->prepare("SELECT start_time, end_time FROM bookings WHERE court_id = ? AND booking_date = ? AND status != 'cancelled'");
    $stmt->bind_param("is", $courtId, $date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $bookedSlots[] = $row;
    }
    
    // Mark available slots
    foreach ($allSlots as &$slot) {
        $slot['available'] = true;
        
        foreach ($bookedSlots as $booked) {
            if ($slot['start_time'] == $booked['start_time']) {
                $slot['available'] = false;
                break;
            }
        }
    }
    
    return $allSlots;
}

/**
 * Create a new booking
 * 
 * @param int $userId User ID
 * @param int $courtId Court ID
 * @param string $date Date in YYYY-MM-DD format
 * @param array $timeSlots Array of time slot IDs
 * @return int|bool Booking ID if created, false otherwise
 */
function createBooking($userId, $courtId, $date, $timeSlots) {
    global $conn;
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Get court hourly rate
        $stmt = $conn->prepare("SELECT hourly_rate FROM courts WHERE court_id = ?");
        $stmt->bind_param("i", $courtId);
        $stmt->execute();
        $result = $stmt->get_result();
        $court = $result->fetch_assoc();
        $hourlyRate = $court['hourly_rate'];
        
        // Calculate total price (30 min = half hourly rate)
        $totalPrice = (count($timeSlots) * $hourlyRate) / 2;
        
        // Create booking record
        $stmt = $conn->prepare("INSERT INTO bookings (user_id, court_id, booking_date, start_time, end_time, status, total_price) VALUES (?, ?, ?, ?, ?, 'pending', ?)");
        
        // Get first and last time slots
        $firstSlot = $timeSlots[0];
        $lastSlot = $timeSlots[count($timeSlots) - 1];
        
        // Get actual time values
        $stmtTime = $conn->prepare("SELECT start_time FROM time_slots WHERE slot_id = ?");
        $stmtTime->bind_param("i", $firstSlot);
        $stmtTime->execute();
        $resultTime = $stmtTime->get_result();
        $startTime = $resultTime->fetch_assoc()['start_time'];
        
        $stmtTime = $conn->prepare("SELECT end_time FROM time_slots WHERE slot_id = ?");
        $stmtTime->bind_param("i", $lastSlot);
        $stmtTime->execute();
        $resultTime = $stmtTime->get_result();
        $endTime = $resultTime->fetch_assoc()['end_time'];
        
        // Insert booking
        $stmt->bind_param("iisssd", $userId, $courtId, $date, $startTime, $endTime, $totalPrice);
        $stmt->execute();
        $bookingId = $stmt->insert_id;
        
        // Commit transaction
        $conn->commit();
        
        return $bookingId;
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();
        return false;
    }
}

/**
 * Confirm a booking (employee function)
 * 
 * @param int $bookingId Booking ID
 * @param int $employeeId Employee ID confirming the booking
 * @return bool True if confirmed, false otherwise
 */
function confirmBooking($bookingId, $employeeId) {
    global $conn;
    
    $stmt = $conn->prepare("UPDATE bookings SET status = 'confirmed', confirmed_by = ?, updated_at = NOW() WHERE booking_id = ?");
    $stmt->bind_param("ii", $employeeId, $bookingId);
    
    return $stmt->execute();
}

/**
 * Cancel a booking
 * 
 * @param int $bookingId Booking ID
 * @param int $userId User ID (for authorization)
 * @param bool $isEmployee Whether the user is an employee
 * @return bool True if cancelled, false otherwise
 */
function cancelBooking($bookingId, $userId, $isEmployee = false) {
    global $conn;
    
    // Check authorization
    if (!$isEmployee) {
        $stmt = $conn->prepare("SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?");
        $stmt->bind_param("ii", $bookingId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false; // Not authorized
        }
    }
    
    $stmt = $conn->prepare("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE booking_id = ?");
    $stmt->bind_param("i", $bookingId);
    
    return $stmt->execute();
}
?>
```

## Frontend Integration

### 1. Homepage (Court Booking Interface)

The HTML, CSS, and JavaScript for the home page are provided in the `badminton-court-booking.html` file. Integrate it with backend by:

1. Replace static court data with dynamic data from the database
2. Connect the login/registration system to the authentication backend
3. Implement booking functionality with AJAX calls to the booking API

### 2. Employee Dashboard

The employee dashboard (provided in `employee-dashboard.html`) needs to be integrated with:

1. Employee authentication system
2. Backend API for booking management
3. Real-time updates for court availability

## Deployment Steps

### 1. Development Environment

1. Set up a local development environment with PHP and MySQL/PostgreSQL
2. Configure virtual host to point to the project directory
3. Test all functionalities in the local environment

### 2. Production Deployment

1. Set up a production server with PHP and database support
2. Configure domain and SSL certificate
3. Create a production database and import schema
4. Upload application files to the server
5. Configure production settings in `config.php`
6. Set appropriate file permissions
7. Test the application in production environment

## Security Considerations

1. Implement proper input validation and sanitization
2. Use prepared statements for all database queries
3. Store passwords securely with bcrypt or similar hashing algorithms
4. Implement CSRF protection for forms
5. Secure session management
6. Enable HTTPS for all connections
7. Implement proper access control for employee functions

## Maintenance Tasks

1. Regular database backups
2. Monitor error logs
3. Update dependencies as needed
4. Perform security audits periodically
5. Optimize database queries for performance