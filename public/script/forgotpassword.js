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
    const prefillPhoneNumber = sessionStorage.getItem('prefillPhoneNumber');
    const phoneInput = document.getElementById('phoneNumber');
    
    if (phoneInput && prefillPhoneNumber) {
      phoneInput.value = prefillPhoneNumber;
      // Optional: Clear the stored value after using it
      sessionStorage.removeItem('prefillPhoneNumber');
    }
  });


  document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    let isValid = true;
    clearError('phoneNumber');
    clearError('newPassword');
    clearError('confirmPassword');
    
    // Enhanced phone number validation
    if (!phoneNumber) {
      showError('phoneNumber', 'Phone number is required');
      isValid = false;
    } else if (phoneNumber.length < 10) {
      showError('phoneNumber', 'Please enter a valid phone number');
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
      const res = await fetch(`${BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, newPassword })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Password reset successful!');
        // Clear the form
        document.getElementById('forgotPasswordForm').reset();
        // Redirect back to login or member page
        window.location.href = 'member.html';
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