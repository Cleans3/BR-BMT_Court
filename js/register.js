// DOM Elements
const registerForm = document.getElementById('registerForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');
const showLoginLink = document.getElementById('showLoginLink');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');

// Mock database from localStorage or create new
let users = JSON.parse(localStorage.getItem('users')) || [
    { id: 1, username: 'admint', password: 'minhbeo', name: 'Admin User', isAdmin: true },
    { id: 2, username: 'user1', password: 'password1', name: 'John Doe', isAdmin: false }
];

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Initialize if not already saved
if (!localStorage.getItem('users')) {
    saveUsers();
}

// Event Listeners
registerForm.addEventListener('submit', handleRegistration);
showLoginLink.addEventListener('click', openLoginModal);
loginBtn.addEventListener('click', openLoginModal);
closeLoginBtn.addEventListener('click', closeLoginModal);
window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
});
loginForm.addEventListener('submit', handleLogin);

// Username validation
usernameInput.addEventListener('blur', validateUsername);

// Password validation
confirmPasswordInput.addEventListener('input', validatePassword);
passwordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value) {
        validatePassword();
    }
});

function validateUsername() {
    const username = usernameInput.value.trim();
    
    if (username && users.some(user => user.username === username)) {
        usernameError.textContent = 'Username already taken';
        usernameInput.classList.add('error');
        return false;
    } else {
        usernameError.textContent = '';
        usernameInput.classList.remove('error');
        return true;
    }
}

function validatePassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (password !== confirmPassword) {
        passwordError.textContent = 'Passwords do not match';
        confirmPasswordInput.classList.add('error');
        return false;
    } else {
        passwordError.textContent = '';
        confirmPasswordInput.classList.remove('error');
        return true;
    }
}

function handleRegistration(e) {
    e.preventDefault();
    
    // Validate inputs
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    
    if (!isUsernameValid || !isPasswordValid) {
        return;
    }
    
    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = usernameInput.value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = passwordInput.value;
    
    // Generate a new user ID
    const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    
    // Create new user object
    const newUser = {
        id: newId,
        username,
        password,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        isAdmin: false
    };
    
    // Add user to database
    users.push(newUser);
    saveUsers();
    
    // Auto login the user
    loginUser(newUser);
    
    // Show success message
    alert('Registration successful! You are now logged in.');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

function openLoginModal(e) {
    e.preventDefault();
    loginModal.style.display = 'flex';
}

function closeLoginModal() {
    loginModal.style.display = 'none';
    loginForm.reset();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        loginUser(user);
        closeLoginModal();
        alert('Login successful!');
        window.location.href = 'index.html';
    } else {
        alert('Invalid username or password');
    }
}

function loginUser(user) {
    // Create a safe version of user without password
    const safeUser = { ...user };
    delete safeUser.password;
    
    // Save to localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(safeUser));
}