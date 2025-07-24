const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://oyinakokocda.org';

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

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
  document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  console.log('Form Submitted');
  clearAllErrors();

  let isValid = true;
  const formData = new FormData(this);
  const userData = {};

  for (let [key, value] of formData.entries()) {
      userData[key] = value.trim();
      console.log('Collected form data:', userData);

  }

  ['otherNames', 'title', 'honTitle', 'qualifications', 'profession'].forEach(field => {
  if (!userData[field]) userData[field] = '';
  });

  // Frontend Validation (same as before)
  if (!userData.otherNames) {
    showError('otherNames', 'Other names are required');
    isValid = false;
    }

  if (!userData.surname) {
    showError('surname', 'Surname is required');
    isValid = false;
    }

  if (!userData.sex) {
    showError('sex', 'Please select your sex');
    isValid = false;
    }

  if (!userData.dob) {
    showError('dob', 'Date of birth is required');
    isValid = false;
    } else {
      const today = new Date();
      const birthDate = new Date(userData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 13) {
          showError('dob', 'You must be at least 13 years old');
          isValid = false;
      }
    }

  if (!userData.quarters) {
      showError('quarters', 'Address is required');
      isValid = false;
    }

  if (!userData.ward) {
      showError('ward', 'Ward is required');
      isValid = false;
    }

  if (!userData.town) {
      showError('town', 'Town is required');
      isValid = false;
    }

  if (!userData.state) {
      showError('state', 'Please select your state');
      isValid = false;
    }

  if (!userData.phoneNumber) {
      showError('phoneNumber', 'Phone number is required');
      isValid = false;
    } else if (!validatePhone(userData.phoneNumber)) {
      showError('phoneNumber', 'Please enter a valid Nigerian phone number');
      isValid = false;
    }

    if (userData.email && !validateEmail(userData.email)) {
      showError('email', 'Enter a valid email address');
      isValid = false;
    }


  if (userData.phoneNo2 && !validatePhone(userData.phoneNo2)) {
    showError('phoneNo2', 'Enter a valid Nigerian phone number');
    isValid = false;
    }


  if (!userData.password) {
      showError('password', 'Password is required');
      isValid = false;
    } else if (!validatePassword(userData.password)) {
      showError('password', 'Password must be at least 6 characters long');
      isValid = false;
    }

  if (!userData.retypePassword) {
      showError('retypePassword', 'Please retype your password');
      isValid = false;
    } else if (userData.password !== userData.retypePassword) {
      showError('retypePassword', 'Passwords do not match');
      isValid = false;
    }

  if (isValid) {
     console.log('Passed validation. Sending data...', userData);
      try {
            const res = await fetch(`${BASE_URL}/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userData)
          });

          const data = await res.json();

          if (res.ok) {
              showSuccessMessage(`Account created for ${userData.phoneNumber}!`);
              this.reset();

                // Save ID and phone to localStorage
              localStorage.setItem('loggedInPhone', data.phoneNumber);
              localStorage.setItem('loggedInUserId', data.id);

              setTimeout(() => {
                  window.location.href = "/dashboard"; // Redirect to dashboard directly
              }, 3000);
          } else {
              if (data.field && data.message) {
                  showError(data.field, data.message);
              } else {
                  alert(data.message || 'Signup failed.');
              }
          }
      } catch (error) {
          console.error('Signup error:', error);
          alert('Something went wrong during signup.');
      }
  }
  });

            // Real-time validation
  document.getElementById('phoneNumber').addEventListener('input', function() {
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

  document.addEventListener('DOMContentLoaded', function () {
    const checkbox = document.getElementById('acceptRules');
    const submitBtn = document.getElementById('submitBtn');

    checkbox.addEventListener('change', function () {
      submitBtn.disabled = !checkbox.checked;
    });
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

document.addEventListener('DOMContentLoaded', () => {
  // Populate Title
  fetch('/admin/static/titles')
    .then(res => res.json())
    .then(data => {
      const titleDropdown = document.getElementById('title');
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.title;
        option.textContent = item.title;
        titleDropdown.appendChild(option);
      });
    });

  // Populate HonTitle
  fetch('/admin/static/hontitles')
    .then(res => res.json())
    .then(data => {
      const honTitleDropdown = document.getElementById('honTitle');
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.Htitle;
        option.textContent = item.Htitle;
        honTitleDropdown.appendChild(option);
      });
    });

     // Populate qualifications
  fetch('/admin/static/qualifications')
    .then(res => res.json())
    .then(data => {
      const qualificationDropdown = document.getElementById('qualifications');
      data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.qualification;
        option.textContent = item.qualification;
        qualificationDropdown.appendChild(option);
      });
    });
});

document.addEventListener('DOMContentLoaded', async () => {
  const quarterDropdown = document.getElementById('quarters');
  const wardDropdown = document.getElementById('ward');

  let wardData = [];

  try {
    const res = await fetch('/admin/static/wards');
    wardData = await res.json();

    // Populate quarter dropdown (unique quarters only)
    const uniqueQuarters = [...new Set(wardData.map(item => item.Quarter))];

    uniqueQuarters.forEach(quarter => {
      const option = document.createElement('option');
      option.value = quarter;
      option.textContent = quarter;
      quarterDropdown.appendChild(option);
    });

    // Filter and populate wards when a quarter is selected
    quarterDropdown.addEventListener('change', () => {
      const selectedQuarter = quarterDropdown.value;

      // Clear existing ward options except default
      wardDropdown.innerHTML = '<option value="">Select Ward</option>';

      const filteredWards = wardData.filter(item => item.Quarter === selectedQuarter);
      filteredWards.forEach(item => {
        const option = document.createElement('option');
        option.value = item.ward;
        option.textContent = item.ward;
        wardDropdown.appendChild(option);
      });
    });

  } catch (err) {
    console.error('Failed to fetch wards:', err);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const stateDropdown = document.getElementById('state');

  try {
    const res = await fetch('/admin/static/states');
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text);
      return;
    }

    const states = await res.json();

    if (!Array.isArray(states)) {
      console.error("Expected array but got:", states);
      return;
    }

    states.forEach(state => {
      const option = document.createElement('option');
      option.value = state.statecode;
      option.textContent = state.statename;
      stateDropdown.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading states:', err);
  }
});