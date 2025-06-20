
  const phone = localStorage.getItem('loggedInPhone');
  if (!phone) window.location.href = '/';

  async function fetchAPI(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(url, options);
    return res.ok ? res.json() : Promise.reject(await res.json());
  }

  async function loadUserProfile() {
    try {
      const user = await fetchAPI('/api/profile', 'POST', { phoneNumber: phone });
      document.getElementById('username').textContent = `${user.othernames || ''} ${user.surname || ''}`;
      document.getElementById('phone').textContent = user.phoneNumber || '';
      document.getElementById('email').textContent = user.email || '';
      document.getElementById('town').textContent = user.town || '';
      document.getElementById('state').textContent = user.state || '';
      document.getElementById('ward').textContent = user.ward || '';
      document.getElementById('quarters').textContent = user.quarters || '';
      document.getElementById('age').textContent = user.age || '';
      document.getElementById('title').textContent = user.title || 'None';
      document.getElementById('honTitle').textContent = user.honTitle || 'None';
      document.getElementById('exitDate').textContent = user.exitDate || 'N/A';
      document.getElementById('qualifications').textContent = user.qualifications || 'None';
    } catch (e) {
      alert('Profile load failed.');
      window.location.href = '/';
    }
  }

  function showSection(id) {
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  }

  //user edit enable
  
  function toggleEdit() {
    const profileDisplay = document.getElementById('profileDisplay');
    const profileEditForm = document.getElementById('profileEditForm');
    
    if (profileEditForm.style.display === 'none' || profileEditForm.style.display === '') {
      profileEditForm.style.display = 'block';
      profileDisplay.style.display = 'none';
    } else {
      profileEditForm.style.display = 'none';
      profileDisplay.style.display = 'block';
    }
  }


  function enableEditMode() {
    document.querySelectorAll('#profileSection select, #profileSection input:not([id=phone]):not([id=age]):not([id=exitDate])')
      .forEach(el => el.disabled = false);
    document.getElementById('editBtn').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
  }

  function cancelEdit() {
    document.querySelectorAll('#profileSection select, #profileSection input')
      .forEach(el => el.disabled = true);
    document.getElementById('editBtn').style.display = 'inline-block';
    document.getElementById('saveBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    loadUserProfile();
  }

  async function updateProfile() {
  const phone = localStorage.getItem('loggedInPhone');
  if (!phone) return alert("You're not logged in.");

  const form = document.getElementById('profileEditForm');

  // Fetch current user profile first
  let currentData;
  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone })
    });
    currentData = await res.json();
  } catch (err) {
    console.error('Error fetching current profile:', err);
    return alert("Failed to retrieve current profile.");
  }

  // Build update payload by comparing current data with form data
  const updatedData = { phoneNumber: phone };

  const fields = ['email', 'state', 'ward', 'quarters', 'sex', 'town', 'title', 'honTitle', 'qualifications'];
  fields.forEach(field => {
    const input = form.querySelector(`#${field}`);
    if (input && input.value.trim() !== (currentData[field] || '').trim()) {
      updatedData[field] = input.value.trim();
    }
  });

  if (Object.keys(updatedData).length === 1) {
    alert("No changes detected.");
    toggleEdit(false);
    return;
  }

  try {
    const res = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    const data = await res.json();
    if (res.ok) {
      alert("Profile updated successfully!");
      toggleEdit(false);
      loadUserProfile();
    } else {
      alert(data.message || "Failed to update profile.");
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong updating profile.");
    }
  }


  //show user receipts
  async function showReceipts() {
    showSection('receiptSection');
    try {
      const data = await fetchAPI(`/api/ledger-entry/${phone}`);
      const html = data.map(r => `
        <p><strong>Date:</strong> ${r.transdate} — <strong>Amount:</strong> ₦${r.amount} — <strong>Remark:</strong> ${r.remark}</p>
      `).join('');
      document.getElementById('receiptTable').innerHTML = html || 'No transactions.';
    } catch {
      document.getElementById('receiptTable').innerHTML = 'Could not load receipts.';
    }
  }

  function clearReceipts() {
    document.getElementById('receiptTable').innerHTML = '';
    showSection('profileSection');
  }

  async function toggleEnquiry() {
    showSection('enquirySection');
    const wards = ["Select Ward", "Awanji", "Ayagama", "Ayasu/Ayaya", "Igoho", "Igonu", "Igukan", "IkanOlotu", "Okoko", "Uhon"];
    const quarters = ["Select Quarters", "Ogotun", "Ogunna", "Ogosi"];

    wardSelect.innerHTML = wards.map(w => `<option value="${w}">${w}</option>`).join('');
    quartersSelect.innerHTML = quarters.map(q => `<option value="${q}">${q}</option>`).join('');

    wardSelect.onchange = () => fetchEnquiry('ward', wardSelect.value);
    quartersSelect.onchange = () => fetchEnquiry('quarters', quartersSelect.value);
  }

  function toggleDropdown() {
    const type = document.querySelector('input[name="filterType"]:checked').value;
    document.getElementById('wardSelect').classList.toggle('hidden', type !== 'ward');
    document.getElementById('quartersSelect').classList.toggle('hidden', type !== 'quarters');
  }

  // ✅ Now define fetchEnquiry
  async function fetchEnquiry(type, value) {
    try {
      const res = await fetch(`/api/enquiry/${type}/${encodeURIComponent(value)}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById('enquiryResults').innerHTML = '<p>No results found.</p>';
        return;
      }

      const html = data.map(r => `
        <p><strong>Date:</strong> ${r.transdate} —
            <strong>Amount:</strong> ₦${r.amount} —
            <strong>Remark:</strong> ${r.remark} —
            <strong>Phone:</strong> ${r.phoneno}
        </p>
      `).join('');
      document.getElementById('enquiryResults').innerHTML = html;
    } catch (err) {
      console.error('Fetch enquiry failed:', err);
      document.getElementById('enquiryResults').innerHTML = '<p>Error fetching records.</p>';
    }
  }

  // ✅ Bind event listeners AFTER fetchEnquiry is defined
  document.getElementById('wardSelect').addEventListener('change', function () {
    const value = this.value;
    if (value && value !== 'Select Ward') {
      fetchEnquiry('ward', value);
    }
  });

  document.getElementById('quartersSelect').addEventListener('change', function () {
    const value = this.value;
    if (value && value !== 'Select Quaters') {
      fetchEnquiry('quarters', value);
    }
  });


  async function logout() {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
    localStorage.clear();
    window.location.href = '/';
  }

  loadUserProfile();
