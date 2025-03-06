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
