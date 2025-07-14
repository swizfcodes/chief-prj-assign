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

      if (result.admin) {
        // ✅ Store adminId
        localStorage.setItem('adminId', result.admin.Id);

        // ✅ Optionally store role
        if (result.admin.role) {
          localStorage.setItem('adminRole', result.admin.role);
        }
      }

      alert('Login successful!');
      window.location.href = '/admin-dashboard.html';
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('An error occurred: ' + err.message);
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
  const loginEmail = document.getElementById('loginEmail')?.value.trim() || '';

  if (loginEmail) {
    sessionStorage.setItem('prefillEmail', loginEmail);
  }

  window.location.href = 'adminforgotpassword.html';
}