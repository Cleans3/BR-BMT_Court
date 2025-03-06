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
