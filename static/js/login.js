// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon
    if (type === 'text') {
        this.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        this.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
});

// Form validation and submission
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Clear error messages on input
emailInput.addEventListener('input', function() {
    emailError.textContent = '';
    this.style.borderColor = '#dee2e6';
});

passwordInput.addEventListener('input', function() {
    passwordError.textContent = '';
    this.style.borderColor = '#dee2e6';
});

// Form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate email
    if (!emailInput.value.trim()) {
        emailError.textContent = 'Email is required';
        emailInput.style.borderColor = '#dc3545';
        isValid = false;
    } else if (!validateEmail(emailInput.value)) {
        emailError.textContent = 'Please enter a valid email address';
        emailInput.style.borderColor = '#dc3545';
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        passwordError.textContent = 'Password is required';
        passwordInput.style.borderColor = '#dc3545';
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters';
        passwordInput.style.borderColor = '#dc3545';
        isValid = false;
    }
    
    if (isValid) {
        // Get form data
        const email = emailInput.value;
        const password = passwordInput.value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Show loading state
        const loginButton = this.querySelector('.btn-login');
        const originalText = loginButton.textContent;
        loginButton.textContent = 'Logging in...';
        loginButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            console.log('Login Data:', {
                email: email,
                password: password,
                rememberMe: rememberMe
            });
            
            // Reset button
            loginButton.textContent = originalText;
            loginButton.disabled = false;
            
            // Show success message
            alert('Login successful! (This is a demo - implement actual authentication)');
            
            // In a real application, you would:
            // 1. Send credentials to your backend
            // 2. Store authentication token
            // 3. Redirect to dashboard
        }, 1500);
    }
});

// Google login button
const googleButton = document.querySelector('.btn-google');
googleButton.addEventListener('click', function() {
    alert('Google Sign-In integration would go here');
    // In a real application, implement Google OAuth
});

// Forgot password link
const forgotPasswordLink = document.querySelector('.forgot-password');
forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Password reset functionality would go here');
    // In a real application, redirect to password reset page
});

// Sign up link
const signupLink = document.querySelector('.signup-link a');
signupLink.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Sign up page would go here');
    // In a real application, redirect to sign up page
});