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


  document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;
    clearError('phoneNumber');
    clearError('newPassword');
    clearError('confirmPassword');

    if (!phoneNumber) {
      showError('phoneNumber', 'Phone number is required');
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

    try {
      const res = await fetch('http://localhost:5500/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        alert('Password reset successful!');
        window.location.href = 'member.html';
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Try again later.');
    }
  });
