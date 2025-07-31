const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://oyinakokocda.org';

function formatDate(dateString) {
  if (!dateString) return '';
  return dateString.split('T')[0];
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

// Month filter (auto populate)
// Function to ensure user is logged in
function ensureUserLoggedIn() {
  const phoneno = getPhoneNumber();
  
  if (!phoneno) {
    // Redirect to login page if no phone number found
    alert('Session expired. Please log in again.');
    window.location.href = '/login.html'; // Adjust path as needed
    return false;
  }
  
  return true;
}

// Month filter setup
function getPhoneNumber() {
  // Try localStorage with different possible keys
  let phoneno = localStorage.getItem('phoneno') || 
                localStorage.getItem('loggedInPhone') || 
                localStorage.getItem('phoneNumber');
  
  // If not in localStorage, try sessionStorage
  if (!phoneno) {
    phoneno = sessionStorage.getItem('phoneno') || 
              sessionStorage.getItem('loggedInPhone') || 
              sessionStorage.getItem('phoneNumber');
  }
  
  // If still not found, try to get from URL parameters
  if (!phoneno) {
    const urlParams = new URLSearchParams(window.location.search);
    phoneno = urlParams.get('phoneno') || urlParams.get('phone');
  }
  
  // If still not found, try to get from a hidden input or data attribute
  if (!phoneno) {
    const phoneInput = document.querySelector('input[name="phoneno"]');
    if (phoneInput) {
      phoneno = phoneInput.value;
    }
  }
  
  // If found from alternative source, store it in localStorage for future use
  if (phoneno) {
    localStorage.setItem('phoneno', phoneno);
  }
  
  return phoneno;
}

// Function to ensure user is logged in
function ensureUserLoggedIn() {
  const phoneno = getPhoneNumber();
  
  if (!phoneno) {
    // Redirect to login page if no phone number found
    alert('Session expired. Please log in again.');
    window.location.href = '/login.html'; // Adjust path as needed
    return false;
  }
  
  return true;
}

// Month filter setup
const monthFilter = document.getElementById('monthFilter');
const yearFilter = document.getElementById('yearFilter');

// Check if elements exist before proceeding
if (!monthFilter || !yearFilter) {
  console.error('Required filter elements not found in DOM');
  throw new Error('monthFilter or yearFilter elements not found');
}

// Add default "Select Month" option
const defaultMonthOption = document.createElement('option');
defaultMonthOption.value = '';
defaultMonthOption.textContent = 'Select Month';
defaultMonthOption.disabled = true;
defaultMonthOption.selected = true;
monthFilter.appendChild(defaultMonthOption);

// Populate months (Jan to Dec)
const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString('default', { month: 'long' })
);
monthNames.forEach((month, i) => {
  const opt = document.createElement('option');
  opt.value = String(i + 1).padStart(2, '0'); // e.g., "01"
  opt.textContent = month;
  monthFilter.appendChild(opt);
});

// Add default "Select Year" option
const defaultYearOption = document.createElement('option');
defaultYearOption.value = '';
defaultYearOption.textContent = 'Select Year';
defaultYearOption.disabled = true;
defaultYearOption.selected = true;
yearFilter.appendChild(defaultYearOption);

// Populate years from current year back to 10 years ago
const now = new Date();
for (let y = now.getFullYear(); y >= now.getFullYear() - 10; y--) {
  const opt = document.createElement('option');
  opt.value = y;
  opt.textContent = y;
  yearFilter.appendChild(opt);
}

// Event listener to fetch total when both month and year are selected
async function fetchMonthlyTotal() {
  const month = monthFilter.value;
  const year = yearFilter.value;

  // Clear previous results if either filter is empty
  if (!month || !year) {
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    if (monthlyTotalEl) {
      monthlyTotalEl.textContent = '';
      delete monthlyTotalEl.dataset.amount;
    }
    return;
  }

  const phoneno = getPhoneNumber();
  if (!phoneno) {
    alert('Session expired. Please log in again.');
    window.location.href = '/login.html';
    return;
  }

  try {
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    if (!monthlyTotalEl) {
      console.error('monthlyTotal element not found');
      return;
    }

    monthlyTotalEl.textContent = 'Loading...';

    const res = await fetch(`/api/member/ledger-entry/monthly-total?month=${year}-${month}&phoneno=${encodeURIComponent(phoneno)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const total = data.total || 0;
    const formattedAmount = `₦${(+total).toLocaleString()}`;
    
    monthlyTotalEl.textContent = formattedAmount;
    monthlyTotalEl.dataset.amount = formattedAmount;

  } catch (error) {
    console.error('Error fetching monthly total:', error);
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    if (monthlyTotalEl) {
      monthlyTotalEl.textContent = '₦0';
    }
    alert('Error loading monthly total. Please try again.');
  }
}

// Add event listeners
monthFilter.addEventListener('change', fetchMonthlyTotal);
yearFilter.addEventListener('change', fetchMonthlyTotal);

// Toggle eye functionality
let amountVisible = true;

function toggleAmountVisibility() {
  amountVisible = !amountVisible;
  const amt = document.getElementById('monthlyTotal');
  const icon = document.getElementById('eyeIcon');
  
  if (amountVisible) {
    // Show the actual amount
    amt.textContent = amt.dataset.amount || '₦0';
    amt.style.color = 'rgb(21 128 61)';
    amt.style.textShadow = 'none';
    
    icon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5
           c4.477 0 8.268 2.943 9.542 7
           -1.274 4.057-5.065 7-9.542 7
           -4.477 0-8.268-2.943-9.542-7z" />`;
  } else {
    // Save the current amount and hide it
    amt.dataset.amount = amt.textContent;
    amt.textContent = '₦••••••';
    amt.style.color = 'rgb(21 128 61)';
    amt.style.textShadow = '0 0 8px rgba(0,0,0,0.5)';
    
    icon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M13.875 18.825A10.05 10.05 0 0112 19
           c-4.477 0-8.268-2.943-9.542-7
           a9.956 9.956 0 012.982-4.419M9.88 9.88a3 3 0 104.24 4.24" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M3 3l18 18" />`;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (!ensureUserLoggedIn()) return;

  yearFilter.value = now.getFullYear();
  monthFilter.value = String(now.getMonth() + 1).padStart(2, '0');

  fetchMonthlyTotal(); // Load initial data
});


//News nd Events section
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/admin/notices');
    const newsItems = await res.json();
    const newsList = document.getElementById('newsList');
    
    newsList.innerHTML = ''; 

    if (newsItems.length === 0) {
      newsList.innerHTML = `<li>No news or events available at this time.</li>`;
      return;
    }

    newsItems.forEach(item => {
      const li = document.createElement('li');
      const date = new Date(item.created_at).toLocaleDateString();
      li.innerHTML = `<span class="font-medium">${item.title}</span> <span class="text-xs text-gray-400 ml-2">(${date})</span>`;
      newsList.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load news:', err);
    document.getElementById('newsList').innerHTML = '<li>Error loading news.</li>';
  }
});


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

  console.log("UpdateProfile triggered");
  async function updateProfile(event) {
    event.preventDefault();
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
      'phone', 'phoneNo2', 'othernames', 'surname','email', 'State', 'sex', 'title',
      'honTitle', 'Quarters', 'Ward', 'town',
      'qualifications', 'profession', 'exitDate'
    ];

    fields.forEach(field => {
      const input = form.querySelector(`#${field}`) || form.querySelector(`#${field.toLowerCase()}`) || form.querySelector(`#${field.toUpperCase()}`);
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


  //  Now define fetchEnquiry
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
          <div class="overflow-x-auto rounded-lg shadow-md my-6">
            <table class="min-w-full divide-y divide-gray-300 bg-white">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ward</th>
                  <th class="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${ward}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">₦${wardTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
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

