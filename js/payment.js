        // Handle back button
        const backButton = document.querySelector('.btn-back');
        
        backButton.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // Handle email button (simulation)
        const emailButton = document.querySelector('.btn-primary');
        
        emailButton.addEventListener('click', () => {
            alert('Booking details would be emailed to your registered address. This is a demo feature.');
        });