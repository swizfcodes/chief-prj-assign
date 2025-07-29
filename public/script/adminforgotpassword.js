const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://oyinakokocda.org'; 
  
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


  // Load and prefill phone number when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Get the prefilled phone number from sessionStorage
    const prefillEmail = sessionStorage.getItem('prefillEmail');
    const emailInput = document.getElementById('email');
    
    if (emailInput && prefillEmail) {
      emailInput.value = prefillEmail;
      // Optional: Clear the stored value after using it
      sessionStorage.removeItem('prefillEmail');
    }
  });


  document.getElementById('adminForgotPasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let isValid = true;
    clearError('email');
    clearError('newPassword');
    clearError('confirmPassword');
    
    // Enhanced phone number validation
    if (!email) {
      showError('email', 'Email is required');
      isValid = false;
    } else if (email.length < 10) {
      showError('email', 'Please enter a valid phone number');
      isValid = false;
    }
    
    if (!newPassword || newPassword.length < 6) {
      showError('newPassword', 'Password must be at least 6 characters');
      isValid = false;
    }
    
    if (newPassword !== confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Resetting...';
    }
    
    try {
      const res = await fetch(`${BASE_URL}/admin/reset-adminpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Password reset successful!');
        // Clear the form
        document.getElementById('adminForgotPasswordForm').reset();
        // Redirect back to login or member page
        window.location.href = 'adminlog.html';
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      // Reset button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });