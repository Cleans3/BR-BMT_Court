// DOM Elements
        const loginBtn = document.querySelector('.login-btn');
        const loginModal = document.querySelector('.login-modal');
        const closeBtn = document.querySelector('.close-btn');
        const loginForm = document.getElementById('login-form');
        const timeSlots = document.querySelectorAll('.time-slot');
        const bookBtn = document.querySelector('.btn-book');
        
        // Selected slots array
        let selectedSlots = [];
        
        // Event Listeners
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
        
        closeBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
        
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Authentication logic would go here
            
            // For demo purposes, we'll just close the modal
            loginModal.style.display = 'none';
            
            // Update UI to show logged in state
            loginBtn.textContent = 'My Account';
        });
        
        // Time slot selection logic
        timeSlots.forEach(slot => {
            if (!slot.classList.contains('occupied')) {
                slot.addEventListener('click', () => {
                    // Toggle selection
                    if (slot.classList.contains('available')) {
                        slot.classList.remove('available');
                        slot.classList.add('selected');
                        selectedSlots.push({
                            court: slot.dataset.court,
                            day: slot.dataset.day,
                            time: slot.dataset.time
                        });
                    } else if (slot.classList.contains('selected')) {
                        slot.classList.remove('selected');
                        slot.classList.add('available');
                        
                        // Remove from selected array
                        const index = selectedSlots.findIndex(s => 
                            s.court === slot.dataset.court && 
                            s.day === slot.dataset.day && 
                            s.time === slot.dataset.time
                        );
                        
                        if (index !== -1) {
                            selectedSlots.splice(index, 1);
                        }
                    }
                    
                    // Update book button state
                    updateBookButtonState();
                });
            } else {
                // For occupied slots, show error message on click
                slot.addEventListener('click', () => {
                    alert('This slot is already booked.');
                });
            }
        });
        
        // Update book button state based on selections
        function updateBookButtonState() {
            if (selectedSlots.length > 0) {
                bookBtn.classList.add('active');
                bookBtn.addEventListener('click', proceedToPayment);
            } else {
                bookBtn.classList.remove('active');
                bookBtn.removeEventListener('click', proceedToPayment);
            }
        }
        
        // Function to proceed to payment page
        function proceedToPayment() {
            // In a real application, you would redirect to a payment page
            // with the selected slots data
            
            alert('Proceeding to payment for selected slots. An employee will confirm your booking.');
            
            // Redirect to payment page would happen here
            // window.location.href = 'payment.html';
        }