 // Login Form Handler(backup)
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
            localStorage.setItem('phoneno', data.phoneNumber); // Changed from 'loggedInPhone' to 'phoneno'
            localStorage.setItem('loggedInPhone', data.phoneNumber); // Keep this for compatibility
            localStorage.setItem('loggedInUserId', data.id);

            showSuccessMessage("Welcome back! Login successful.");
            this.reset();
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);
        }else {
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