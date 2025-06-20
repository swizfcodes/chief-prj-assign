
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

        // Sign Up Form Handler

        // Login Form Handler
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          clearAllErrors();

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
                  const res = await fetch('http://localhost:5500/login', {
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
            
            // Here you would make an API call to verify credentials
            /*
            fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber: phone, password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Handle successful login
                } else {
                    // Handle failed login
                }
            });
            */
        }

        // Real-time validation
       /* document.getElementById('phoneNumber').addEventListener('input', function() {
            const phone = this.value.trim();
            if (phone && !validatePhone(phone)) {
                showError('phoneNumber', 'Please enter a valid Nigerian phone number');
            } else if (phone) {
                clearError('phoneNumber');
            }
        });

        document.getElementById('retypePassword').addEventListener('input', function() {
            const password = document.getElementById('password').value;
            const retypePassword = this.value;
            
            if (retypePassword && password !== retypePassword) {
                showError('retypePassword', 'Passwords do not match');
            } else if (retypePassword) {
                clearError('retypePassword');
            }
        });

        // Export function to get user data (for database integration)
        window.getUserData = function() {
            return users;
        };

        // Export function to clear user data
        window.clearUserData = function() {
            users = [];
            console.log('User data cleared');
        };



        // admin logih form handler

     document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    email: form.email.value,
    password: form.password.value
  };

  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error("Expected JSON but got:\n" + text.slice(0, 200)); // Show first 200 chars
    }

    const result = await res.json();

    if (res.ok) {
      localStorage.setItem('adminToken', result.token);
      alert('Login successful!');
      window.location.href = '/admin-dashboard.html';
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('An error occurred: ' + err.message);
  }
  });*/