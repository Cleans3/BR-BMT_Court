// Toggle day tabs
        const dayTabs = document.querySelectorAll('.day-tab');
        
        dayTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                dayTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // In a real app, this would load the court schedule for the selected day
                // For demo purposes, we'll just log the selected day
                console.log('Selected day:', tab.textContent);
            });
        });
        
        // Confirm booking buttons
        const confirmButtons = document.querySelectorAll('.btn-success');
        
        confirmButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the booking ID from the row
                const row = this.closest('tr');
                const bookingId = row.cells[0].textContent;
                
                // In a real app, this would call an API to confirm the booking
                // For demo purposes, we'll just update the UI
                const statusCell = row.cells[5].querySelector('.status-badge');
                statusCell.textContent = 'Confirmed';
                statusCell.classList.remove('status-pending');
                statusCell.classList.add('status-confirmed');
                
                // Remove the confirm button
                this.remove();
                
                console.log('Confirmed booking:', bookingId);
            });
        });
        
        // Cancel booking buttons
        const cancelButtons = document.querySelectorAll('.btn-danger');
        
        cancelButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the booking ID from the row
                const row = this.closest('tr');
                const bookingId = row.cells[0].textContent;
                
                // In a real app, this would call an API to cancel the booking
                // For demo purposes, we'll just update the UI
                const statusCell = row.cells[5].querySelector('.status-badge');
                statusCell.textContent = 'Cancelled';
                statusCell.classList.remove('status-pending');
                statusCell.classList.remove('status-confirmed');
                statusCell.classList.add('status-cancelled');
                
                // Remove all action buttons
                const actionCell = row.cells[6];
                actionCell.innerHTML = '';
                
                console.log('Cancelled booking:', bookingId);
            });
        });
