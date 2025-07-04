const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://chief-prj-assign.onrender.com';


async function fetchAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(fullUrl, options);
    const result = await res.json();
    if (!res.ok) throw result;
    return result;
  } catch (err) {
    console.error('API error:', err);
    throw err;
  }
}

  const phone = localStorage.getItem('loggedInPhone');
  if (!phone) window.location.href = '/';



  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
  }


  // On page load: collapse if screen is <= 1400px
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 1400) {
      sidebar.classList.add('collapsed');
    } 
      // Optional: re-collapse on resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 1400) {
        sidebar.classList.add('collapsed');
      } else {
        sidebar.classList.remove('collapsed');
      }
    });
  });

  function toggleDropdown() {
  const type = document.querySelector('input[name="filterType"]:checked').value;
  document.getElementById('wardSelect').classList.toggle('hidden', type !== 'ward');
  document.getElementById('quartersSelect').classList.toggle('hidden', type !== 'quarters');

  // Animation effect on switch
  const results = document.getElementById('enquiryResults');
  results.style.opacity = 0;
  setTimeout(() => {
    results.innerHTML = 'Please select a ' + type + ' to view enquiries.';
    results.style.opacity = 1;
  }, 200);
}


  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.dark-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
  }


  async function loadUserProfile() {
    const phone = localStorage.getItem('loggedInPhone');

    try {
      const user = await fetchAPI('/api/profile', 'POST', { phoneNumber: phone });
      currentUser = user;
      document.getElementById('username').textContent = `${user.othernames || ''} ${user.surname || ''}`;
      document.getElementById('phone').textContent = user.phoneNumber || '';
      document.getElementById('phoneNo2').textContent = user.phoneNo2 || '';
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

      // Show landing section,
      showLandingSection();
    } catch (e) {
      alert('Profile load failed.');
      window.location.href = '/';
    }
  }


  function showLandingSection() {
    document.getElementById('landingSection').classList.remove('hidden');
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('receiptSection').classList.add('hidden');
    document.getElementById('enquirySection').classList.add('hidden');
  }

  function showSection(sectionId) {
    // Hide all main sections
    document.getElementById('landingSection').classList.add('hidden');
    document.getElementById('profileSection').classList.add('hidden');
    document.getElementById('receiptSection').classList.add('hidden');
    document.getElementById('enquirySection').classList.add('hidden');
    // Show the requested section
    document.getElementById(sectionId).classList.remove('hidden');
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
    const oldPhone = localStorage.getItem('loggedInPhone');
    if (!oldPhone) return alert("You're not logged in.");

    const form = document.getElementById('profileEditForm');

    // Get current data
    let currentData;
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: oldPhone })
      });
      currentData = await res.json();
    } catch (err) {
      console.error('Error fetching current profile:', err);
      return alert("Failed to retrieve current profile.");
    }

    // Compare form values to current data
    const updatedData = { oldPhoneNumber: oldPhone };
    const fields = [
      'phone', 'phoneNo2', 'email', 'state', 'sex', 'title',
      'honTitle', 'quarters', 'ward', 'town',
      'qualifications', 'profession', 'exitDate'
    ];

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
        //Update localStorage phone number before reload
        if (updatedData.phone && updatedData.phone !== oldPhone) {
          localStorage.setItem('loggedInPhone', updatedData.phone);
        }

        alert("Profile updated successfully!");
        toggleEdit(false);
        loadUserProfile(); // Now pulls updated phone
      } else {
        alert(data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert("Something went wrong updating profile.");
    }
  }



  // Store all fetched receipts for advanced filtering and exporting
  let allReceipts = [];

  // Show receipts section and load data
  async function showReceipts() {
    showSection('receiptSection');
    try {
      const data = await fetchAPI(`/api/ledger-entry/${phone}`);
      allReceipts = data;
      renderReceipts(allReceipts);
    } catch {
      document.getElementById('receiptTable').innerHTML = 'Could not load receipts.';
    }
  }

  // Render receipts in the table
  function renderReceipts(receipts) {
    if (!receipts || receipts.length === 0) {
      document.getElementById('receiptTable').innerHTML = '<p>No transactions found.</p>';
      return;
    }

    const table = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Amount (₦)</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          ${receipts.map((r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${new Date(r.transdate).toLocaleDateString()}</td>
              <td>${Number(r.amount).toLocaleString()}</td>
              <td>${r.remark}</td>
              
            </tr>
          `).join('')}
           <th> Total Amount</th>
            <td>Total Receipts: ${receipts.length}</td>
          <td>₦${receipts.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString()}</td>
        </tbody>
      </table>
    `;

    document.getElementById('receiptTable').innerHTML = table;
  }


  // Filter receipts by date range
  function filterReceipts() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;

    if (!from && !to) {
      renderReceipts(allReceipts);
      return;
    }

    const filtered = allReceipts.filter(r => {
      const d = new Date(r.transdate);
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });

    renderReceipts(filtered);
  }

  // Clear receipts view and filters
  function clearReceipts() {
    document.getElementById('receiptTable').innerHTML = '';
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
    showSection('landingSection');
  }

  // Export filtered receipts as CSV
  function exportReceiptsToCSV() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    const filtered = filterByDateRange(from, to);

    let csv = 'Date,Amount,Remark\n';
    filtered.forEach(r => {
      const row = `${r.transdate},${r.amount},${r.remark}`;
      csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'receipts.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Print/Download PDF of receipts
function printReceiptsPDF() {
  const fromDate = document.getElementById('fromDate').value;
  const toDate = document.getElementById('toDate').value;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let filteredReceipts = allReceipts || [];

  if (fromDate || toDate) {
    filteredReceipts = filteredReceipts.filter(r => {
      const date = new Date(r.transdate);
      const iso = date.toISOString().split('T')[0];
      if (fromDate && toDate) return iso >= fromDate && iso <= toDate;
      if (fromDate) return iso >= fromDate;
      if (toDate) return iso <= toDate;
    });
  }

  let dateHeading;
  if (!fromDate && !toDate) {
    dateHeading = `Date: ${today.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })}`;
  } else if (fromDate === toDate) {
    dateHeading = `Date: ${fromDate}`;
  } else {
    dateHeading = `FROM ${fromDate || todayStr} TO ${toDate || todayStr}`;
  }

  const phone = localStorage.getItem('loggedInPhone') || '';
  const userName = document.getElementById('username')?.textContent || 'User';

  const html = `
    <html>
      <head>
        <title>OCDA Receipt</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            background: #fff;
            color: #222;
          }
          h1, h2, h4 {
            text-align: center;
            margin-bottom: 10px;
          }
          h1 {
            font-size: 24px;
            font-weight: bold;
          }
          h2 {
            font-size: 20px;
            color: #555;
          }
          h4 {
            margin-top: 0;
            font-size: 16px;
            font-weight: normal;
            color: #777;
          }
          hr {
            margin: 20px 0;
            border: none;
            border-top: 2px solid #888;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            border: 1px solid #ccc;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
            font-weight: bold;
          }
          .no-data {
            text-align: center;
            color: #999;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <h1>OYIN-AKOKO COMMUNITY DEVELOPMENT ASSOCIATION (OCDA)</h1>
        <h2>Receipt for ${userName} (${phone})</h2>
        <h4>${dateHeading}</h4>
        <hr />
        ${filteredReceipts.length === 0
          ? `<p class="no-data">No transactions found.</p>`
          : `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount (₦)</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                ${filteredReceipts.map(r => `
                  <tr>
                    <td>${r.transdate}</td>
                    <td>${r.amount}</td>
                    <td>${r.remark}</td>
                  </tr>
                `).join('')}
            <th> Total Amount</th>
          
          <td>₦${filteredReceipts.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString()}</td>
              </tbody>
            </table>
          `}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}


  // Utility to filter by current range
  function filterByDateRange(from, to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    return allReceipts.filter(r => {
      const d = new Date(r.transdate);
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });
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

    const grouped = {};

    data.forEach(r => {
      if (!grouped[r.phoneno]) grouped[r.phoneno] = [];
      grouped[r.phoneno].push(r);
    });

    const html = Object.entries(grouped).map(([phone, receipts]) => {
      const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount), 0);

      const rows = receipts.map(r => `
        <tr>
          <td>${r.transdate}</td>
          <td>₦${Number(r.amount).toLocaleString()}</td>
          <td>${r.remark}</td>
        </tr>
      `).join('');

      return `
        <div class="receipt-group">
          <button class="accordion">Phone: ${phone} — Total Transactions Amount: ₦${totalAmount.toLocaleString()} (${receipts.length} receipts)</button>
          <div class="panel">
            <table class="enquiry-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('enquiryResults').innerHTML = html;

    // Enable accordion toggle
    document.querySelectorAll('.accordion').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const panel = btn.nextElementSibling;
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      });
    });


    } catch (err) {
      console.error('Fetch enquiry failed:', err);
      document.getElementById('enquiryResults').innerHTML = '<p>Error fetching records.</p>';
    }
  }

  //  Bind event listeners AFTER fetchEnquiry is defined
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

