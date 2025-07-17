const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://chief-prj-assign.onrender.com';

function formatDate(date) {
  return date.split('T')[0];
}


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



  // On page load: collapse if screen is <= 1400px
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const screenWidth = () => window.innerWidth;

function toggleSidebar() {
  if (screenWidth() < 768) {
    // Mobile: toggle visibility
    if (sidebar.classList.contains('hidden')) {
      // Show sidebar with text
      sidebar.classList.remove('hidden');
      sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
      sidebar.classList.add('w-60');
      // Show text labels
      sidebar.querySelectorAll('span').forEach(span => {
        span.className = span.className.replace(/hidden|xl:inline/g, '');
        span.classList.add('inline');
      });
    } else {
      // Hide sidebar
      sidebar.classList.add('hidden');
    }
  } else if (screenWidth() < 1200) {
    // Tablet: toggle between collapsed and expanded
    if (sidebar.classList.contains('w-11') || !sidebar.classList.contains('w-60')) {
      // Expand
      sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
      sidebar.classList.add('w-60');
      mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
      mainContent.classList.add('md:pl-60');
      // Show text labels
      sidebar.querySelectorAll('span').forEach(span => {
        span.className = span.className.replace(/hidden|xl:inline/g, '');
        span.classList.add('inline');
      });
    } else {
      // Collapse
      sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
      sidebar.classList.add('w-11');
      mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
      mainContent.classList.add('md:pl-11');
      // Hide text labels
      sidebar.querySelectorAll('span').forEach(span => {
        span.className = span.className.replace(/inline|xl:inline/g, '');
        span.classList.add('hidden');
      });
    }
  } else {
    // Desktop: toggle between collapsed and expanded
    if (sidebar.classList.contains('w-11') || !sidebar.classList.contains('w-60')) {
      // Expand
      sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
      sidebar.classList.add('w-60');
      mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
      mainContent.classList.add('xl:pl-60');
      // Show text labels
      sidebar.querySelectorAll('span').forEach(span => {
        span.className = span.className.replace(/hidden|xl:inline/g, '');
        span.classList.add('inline');
      });
    } else {
      // Collapse
      sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
      sidebar.classList.add('w-11');
      mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
      mainContent.classList.add('xl:pl-11');
      // Hide text labels
      sidebar.querySelectorAll('span').forEach(span => {
        span.className = span.className.replace(/inline|xl:inline/g, '');
        span.classList.add('hidden');
      });
    }
  }
}

function handleTabClick(sectionId) {
  // Hide all sections
  document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));

  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // Auto-collapse/hide sidebar based on screen size
  if (screenWidth() < 768) {
    // Mobile: hide sidebar completely
    sidebar.classList.add('hidden');
  } else if (screenWidth() < 1200) {
    // Tablet: collapse to narrow
    sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
    sidebar.classList.add('w-11');
    mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
    mainContent.classList.add('md:pl-11');
    // Hide text labels
    sidebar.querySelectorAll('span').forEach(span => {
      span.className = span.className.replace(/inline|xl:inline/g, '');
      span.classList.add('hidden');
    });
  }
  // For >1200 (desktop): do nothing - let user toggle manually
}

// Initialize sidebar state based on screen size
function initializeSidebar() {
  if (screenWidth() < 768) {
    // Mobile: hidden by default
    sidebar.classList.add('hidden');
  } else if (screenWidth() < 1200) {
    // Tablet: show collapsed
    sidebar.classList.remove('hidden');
    sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
    sidebar.classList.add('w-11');
    mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
    mainContent.classList.add('md:pl-11');
    // Hide text labels
    sidebar.querySelectorAll('span').forEach(span => {
      span.className = span.className.replace(/inline|xl:inline/g, '');
      span.classList.add('hidden');
    });
  } else {
    // Desktop: show expanded
    sidebar.classList.remove('hidden');
    sidebar.className = sidebar.className.replace(/w-\d+|md:w-\d+|xl:w-\d+/g, '');
    sidebar.classList.add('w-60');
    mainContent.className = mainContent.className.replace(/md:pl-\d+|xl:pl-\d+/g, '');
    mainContent.classList.add('xl:pl-60');
    // Show text labels
    sidebar.querySelectorAll('span').forEach(span => {
      span.className = span.className.replace(/hidden|xl:inline/g, '');
      span.classList.add('inline');
    });
  }
}

// Handle window resize with debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initializeSidebar();
  }, 150);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeSidebar);


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

  //load dropdowns
  document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileEditForm');
  if (!form) return;

  const titleSelect = form.querySelector('#title');
  const honTitleSelect = form.querySelector('#honTitle');
  const qualificationSelect = form.querySelector('#qualifications');

  const loadDropdown = async (endpoint, selectElement, valueKey) => {
    try {
      const res = await fetch(`/admin/static/${endpoint}`);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error(`Invalid data: ${JSON.stringify(data)}`);

      data.forEach(item => {
        const val = item[valueKey];
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        selectElement.appendChild(option);
      });
    } catch (err) {
      console.error(`Error loading ${endpoint}:`, err);
    }
  };

  // Load dropdowns
  loadDropdown('titles', titleSelect, 'title');
  loadDropdown('hontitles', honTitleSelect, 'Htitle');
  loadDropdown('qualifications', qualificationSelect, 'qualification');
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileEditForm');
  if (!form) return;
  const stateSelect = document.getElementById('State');

  fetch('/admin/static/states')
    .then(res => res.json())
    .then(states => {
      if (!Array.isArray(states)) throw new Error('Invalid states response');

      states.forEach(state => {
        const option = document.createElement('option');
        option.value = state.statecode; 
        option.textContent = state.statename; 
        stateSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error('Error loading states:', err);
    });
});


document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profileEditForm');
  if (!form) return;

  const quarterDropdown = document.getElementById('Quarters');
  const wardDropdown = document.getElementById('Ward');

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
  const form = document.getElementById('selectForm');
  if (!form) return;

  const quarterDropdown = document.getElementById('quartersSelect');
  const wardDropdown = document.getElementById('wardSelect');

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

    // Populate ward dropdown (all wards regardless of quarter)
    const uniqueWards = [...new Set(wardData.map(item => item.ward))];
    uniqueWards.forEach(ward => {
      const option = document.createElement('option');
      option.value = ward;
      option.textContent = ward;
      wardDropdown.appendChild(option);
    });

  } catch (err) {
    console.error('Failed to fetch wards:', err);
  }
});



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
      'phone', 'phoneNo2', 'email', 'State', 'sex', 'title',
      'honTitle', 'Quarters', 'Ward', 'town',
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
      <div id="receiptTable" class="bg-white rounded-xl p-5 font-sans text-[15px] text-gray-800 shadow-md max-h-[400px] overflow-y-auto transition-all duration-300 ease-in-out">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-blue-100 text-blue-900">
              <th class="py-2 px-4 text-left">#</th>
              <th class="py-2 px-4 text-left">Date</th>
              <th class="py-2 px-4 text-left">Amount (₦)</th>
              <th class="py-2 px-4 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            ${receipts.map((r, i) => `
              <tr class="hover:bg-blue-50 transition-all">
                <td class="py-2 px-4">${i + 1}</td>
                <td class="py-2 px-4">${formatDate(r.transdate)}</td>
                <td class="py-2 px-4">₦${Number(r.amount).toLocaleString()}</td>
                <td class="py-2 px-4">${r.remark}</td>
              </tr>
            `).join('')}
            <tr class="bg-green-100 font-semibold">
              <td class="py-2 px-4 text-green-900" colspan="2">Total Receipts: ${receipts.length}</td>
              <td class="py-2 px-4 text-green-900" colspan="2">₦${receipts.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
    // Clear HTML content of the receipt table and result container
    document.getElementById('receiptTable').innerHTML = '';
    document.getElementById('enquiryResults').innerHTML = '<p>Select a ward or quarters to begin.</p>'; // <-- also clear enquiry result container

    // Reset input fields
    document.getElementById('fromDate').value = '';
    document.getElementById('toDate').value = '';
    document.getElementById('enquiryFrom').value = '';
    document.getElementById('enquiryTo').value = '';
    document.getElementById('wardSelect').value = '';
    document.getElementById('quartersSelect').value = '';

    // Hide or reset all other sections (if applicable)
    showSection('landingSection'); // switch to landing or default section
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
                    <td>${formatDate(r.transdate)}</td>
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
  console.log("fetchEnquiry called");
  const fromDate = document.getElementById('enquiryFrom').value;
  const toDate = document.getElementById('enquiryTo').value;

  try {
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('from', fromDate);
    if (toDate) queryParams.append('to', toDate);

    const res = await fetch(`/api/enquiry/${type}/${encodeURIComponent(value)}?${queryParams.toString()}`);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      document.getElementById('enquiryResults').innerHTML = '<p>No results found.</p>';
      return;
    }

    let html = '';

    if (type === 'ward') {
      const total = data.reduce((sum, r) => sum + Number(r.amount), 0);
      html = `
        <h2 class="text-xl font-bold mb-2">Selected Ward: ${value}</h2>
        <p class="text-lg font-semibold text-green-700 mb-4">Total = ₦${total.toLocaleString()}</p>
      `;
    } else if (type === 'quarters') {
      const wardGroups = {};
      data.forEach(r => {
        const ward = r.ward || r.wardname || 'Unknown';
        if (!wardGroups[ward]) wardGroups[ward] = [];
        wardGroups[ward].push(r);
      });

      let quarterTotal = 0;
      html = `<h2 class="text-xl font-bold mb-4">Quarter: ${value}</h2>`;

      Object.entries(wardGroups).forEach(([ward, records]) => {
        const wardTotal = records.reduce((sum, r) => sum + Number(r.amount), 0);
        quarterTotal += wardTotal;
        html += `
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-700">Ward ${ward} under Quarter ${value}</h3>
            <p class="text-green-700 mb-2">Total = ₦${wardTotal.toLocaleString()}</p>
          </div>
        `;
      });

      html += `<p class="mt-6 text-xl font-bold text-blue-700">Quarter Total = ₦${quarterTotal.toLocaleString()}</p>`;
    }

    document.getElementById('enquiryResults').innerHTML = html;

  } catch (err) {
    console.error('Fetch enquiry failed:', err);
    document.getElementById('enquiryResults').innerHTML = '<p class="text-red-500">Error fetching records.</p>';
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

