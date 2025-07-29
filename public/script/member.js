
// Form toggle functionality
function showForm(formType) {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    // Reset active states
    toggleBtns.forEach(btn => btn.classList.remove('active'));
    signupForm.classList.remove('active');
    loginForm.classList.remove('active');
    
    // Clear any success messages
    document.getElementById('successMessage').style.display = 'none';
    
    if (formType === 'signup') {
        signupForm.classList.add('active');
        toggleBtns[0].classList.add('active');
    } else {
        loginForm.classList.add('active');
        toggleBtns[1].classList.add('active');
    }
}

// Validation functions
function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.style.borderColor = '#e74c3c';
    }
}

function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + 'Error');
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.style.display = 'none';
        inputElement.style.borderColor = '#e1e5e9';
    }
}

function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error');
    const inputElements = document.querySelectorAll('input, select');
    
    errorElements.forEach(error => error.style.display = 'none');
    inputElements.forEach(input => input.style.borderColor = '#e1e5e9');
}

function validatePhone(phone) {
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    return password.length >= 6;
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Scroll to top to show the message
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  clearAllErrors();

const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://oyinakokocda.org';

  let isValid = true;
  const identifier = document.getElementById('loginPhone').value.trim(); // ID or Phone
  const password = document.getElementById('loginPassword').value;

  if (!identifier) {
      showError('loginPhone', 'ID or phone number is required');
      isValid = false;
  }

  if (!password) {
      showError('loginPassword', 'Password is required');
      isValid = false;
  }

  if (isValid) {
      try {
            const res = await fetch(`${BASE_URL}/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ identifier, password })
          });

          let data;
          try {
              data = await res.json();
          } catch (err) {
              console.error("Invalid JSON:", err);
              alert("Server returned invalid response.");
              return;
          }

          console.log("Login response:", data);

          if (res.ok) {
              // Save user ID or phone for profile use
              localStorage.setItem('loggedInPhone', data.phoneNumber);
              localStorage.setItem('loggedInUserId', data.id);

              showSuccessMessage("Welcome back! Login successful.");
              this.reset();
              setTimeout(() => {
                  window.location.href = "/dashboard";
              }, 1500);
          } else {
              if (data.field === 'identifier') {
                  showError('loginPhone', data.message);
              } else if (data.field === 'password') {
                  showError('loginPassword', data.message);
              } else {
                  alert(data.message || 'Login failed. Please try again.');
              }
          }

      } catch (error) {
          console.error('Login error:', error);
          alert('Something went wrong while trying to log in.');
      }
  }
});


    const passwordInput = document.getElementById("loginPassword");
    const togglePassword = document.getElementById("togglePassword");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");

    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        
        // Toggle SVG display
        eyeOpen.style.display = isPassword ? "none" : "inline";
        eyeClosed.style.display = isPassword ? "inline" : "none";
    });

    function handleForgotPasswordClick() {
    // Get the phone number from login form
    const loginPhoneNumber = document.getElementById('loginPhone')?.value.trim() || '';
    
    // Store phone number in sessionStorage for the next page
    if (loginPhoneNumber) {
        sessionStorage.setItem('prefillPhoneNumber', loginPhoneNumber);
    }
    
    // Navigate to forgot password page
    window.location.href = 'forgotpassword.html';
    }

// In-memory storage for demonstration (replace with actual database calls)
let users = [];

    function saveUserData(userData, type) {
    if (type === 'signup') {
        users.push(userData);
        console.log('User saved:', userData);
        console.log('All users:', users);
        
        // Here you would make an API call to your database
        // Example:
        /*
        fetch('/api/users/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('User saved to database:', data);
        })
        .catch(error => {
            console.error('Error saving user:', error);
        });
        */
    }
}

// Debug function to show current users
function showRegisteredUsers() {
    console.log('=== REGISTERED USERS ===');
    if (users.length === 0) {
        console.log('No users registered yet');
    } else {
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.surname} - ${user.phoneNumber}`);
        });
    }
    console.log('========================');
    return users;
}

// Add a button to check registered users (for debugging)
window.showUsers = showRegisteredUsers;

function authenticateUser(phone, password) {
    console.log('Attempting to authenticate:', phone);
    console.log('Total registered users:', users.length);
    console.log('All users:', users.map(u => ({ phone: u.phoneNumber, name: u.firstName + ' ' + u.surname })));
    
    // In a real application, this would check against your database
    const user = users.find(u => u.phoneNumber === phone && u.password === password);
    
    if (user) {
        console.log('User authenticated successfully:', {
            name: user.firstName + ' ' + user.surname,
            phone: user.phoneNumber,
            createdAt: user.createdAt
        });
        return user;
    } else {
        console.log('Authentication failed - user not found or wrong password');
        return false;
    }
}