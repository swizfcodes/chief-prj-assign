const isLocal = window.location.hostname === 'localhost';
const BASE_URL = isLocal ? 'http://localhost:5500' : 'https://chief-prj-assign.onrender.com';

  document.addEventListener('DOMContentLoaded', function () {
    const role = localStorage.getItem('adminRole');
    // Hide the admin tab for normal admins
    if (role !== 'superadmin') {
      const adminTab = document.getElementById('adminTabBtn');
      if (adminTab) adminTab.style.display = 'none';
    }
  });

const token =  `Bearer ${localStorage.getItem('adminToken')}`;

window.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const tabButtons = document.querySelectorAll('.tab-button');

  // Defensive checks
  if (!menuToggle || !sidebar || !overlay || tabButtons.length === 0) return;

  // Toggle sidebar on hamburger click
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebar.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
  });

  // Hide sidebar when clicking outside (on overlay)
  overlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.add('hidden');
    overlay.classList.add('hidden');
  });

  // Close sidebar on tab click (mobile only)
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.add('hidden');
        overlay.classList.add('hidden');
      }
    });
  });
});

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    // For example with JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

let allMembers = [];
let currentPage = 1;
const rowsPerPage = 10;

async function loadAdmins() {
  const token = localStorage.getItem('adminToken');
  if (!token) return document.getElementById('adminTable').innerText = 'Unauthorized – No token found.';

  try {
    const res = await fetch(`${BASE_URL}/admin/list`, {
      headers: { 'Authorization':  `Bearer ${localStorage.getItem('adminToken')}` }
    });

    const admins = await res.json();
    if (!res.ok || !Array.isArray(admins)) {
      return document.getElementById('adminTable').innerText = 'Failed to load admins.';
    }

    if (admins.length === 0) {
      return document.getElementById('adminTable').innerText = 'No admins found.';
    }

    const table = `
      <table class="w-full text-left border border-collapse">
        <thead>
          <tr class="bg-gray-200">
            <th class="p-2 border">#</th>
            <th class="p-2 border">Full Name</th>
            <th class="p-2 border">Email</th>
            <th class="p-2 border">Role</th>
            <th class="p-2 border">Status</th>
            <th class="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${admins.map((admin, index) => `
            <tr>
              <td class="p-2 border">${index + 1}</td>
              <td class="p-2 border">${admin.fullname}</td>
              <td class="p-2 border">${admin.email}</td>
              <td class="p-2 border">${admin.role}</td>
              <td class="p-2 border">${admin.active == 1 || admin.active === '1' ? 'Active' : 'Inactive'}</td>
              <td class="p-2 border">
                <button onclick="toggleAdminStatus('${admin.Id}', ${admin.active})" class="px-2 py-1 rounded ${admin.active ? 'bg-yellow-500' : 'bg-green-500'} text-white text-xs">
                  ${admin.active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="px-2 py-1 bg-blue-600 text-white rounded text-xs edit-admin-btn"
                  data-id="${admin.Id}"
                  data-fullname="${admin.fullname}"
                  data-email="${admin.email}"
                  data-role="${admin.role}">
                  Edit
                </button>
                <button onclick="deleteAdmin('${admin.Id}')" class="px-2 py-1 bg-red-600 text-white rounded text-xs">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    document.getElementById('adminTable').innerHTML = table;
  } catch (err) {
    console.error('Admin Load Error:', err);
    document.getElementById('adminTable').innerText = 'Error loading admins.';
  }
}

// Open Edit Modal and fill form
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('edit-admin-btn')) {
    const btn = e.target;
    document.getElementById('editAdminId').value = btn.getAttribute('data-id');
    document.getElementById('editAdminFullname').value = btn.getAttribute('data-fullname');
    document.getElementById('editAdminEmail').value = btn.getAttribute('data-email');
    document.getElementById('editAdminRole').value = btn.getAttribute('data-role');
    document.getElementById('editAdminModal').classList.remove('hidden');
  }
});

// Handle Edit Admin form submission
document.getElementById('editAdminForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const token = `Bearer ${localStorage.getItem('adminToken')}`;
  const id = document.getElementById('editAdminId').value;
  const fullname = document.getElementById('editAdminFullname').value;
  const email = document.getElementById('editAdminEmail').value;
  const role = document.getElementById('editAdminRole').value;

  try {
    const res = await fetch(`${BASE_URL}/admin/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ fullname, email, role })
    });
    const result = await res.json();
    alert(res.ok ? 'Admin updated successfully!' : (result.message || 'Update failed'));
    if (res.ok) {
      document.getElementById('editAdminModal').classList.add('hidden');
      loadAdmins();
    }
  } catch (err) {
    alert('Server error');
  }
});

// Toggle admin status (activate/deactivate)
async function toggleAdminStatus(adminId, isActive) {
  const token = `Bearer ${localStorage.getItem('adminToken')}`;
  const action = isActive ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this admin?`)) return;
  try {
    const res = await fetch(`${BASE_URL}/admin/${action}/${adminId}`, {
      method: 'PATCH',
      headers: { 'Authorization': token}
    });
    const result = await res.json();
    alert(res.ok ? `Admin ${action}d successfully!` : (result.message || 'Action failed'));
    if (res.ok) loadAdmins();
  } catch (err) {
    alert('Server error');
  }
}

// Delete admin
async function deleteAdmin(adminId) {
  const token = `Bearer ${localStorage.getItem('adminToken')}` ;
  if (!confirm('Are you sure you want to delete this admin?')) return;
  try {
    const res = await fetch(`${BASE_URL}/admin/delete/${adminId}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    });
    const result = await res.json();
    alert(res.ok ? 'Admin deleted successfully!' : (result.message || 'Delete failed'));
    if (res.ok) loadAdmins();
  } catch (err) {
    alert('Server error');
  }
}

// 2. Define setupAdminTab globally
function setupAdminTab() {
  // Attach submit handler only once
  if (!setupAdminTab.initialized) {
    document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        fullname: form.fullname.value,
        email: form.email.value,
        password: form.password.value,
        role: form.role.value
      };

      try {

      const res = await fetch(`${BASE_URL}/admin/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('adminToken') || ''
          },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(res.ok ? 'Admin created!' : (result.message || 'Error creating admin'));
        if (res.ok) form.reset();
        loadAdmins(); // Refresh list after creation
      } catch (err) {
        console.error('Create Admin Error:', err);
        alert('Server error');
      }
    });
    setupAdminTab.initialized = true;
  }
  loadAdmins(); // Always refresh admin list when tab is shown
}

  // Call setupAdminTab() when the "Administrators" tab is shown
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.dataset.tab === 'create-member') {
        setupAdminTab();
      }
    });
  });

      // Format amount with ₦ and commas
    const formatAmount = amount => `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    // Format date to DD/MM/YYYY
    const formatDate = dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date)) return dateStr;
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active-tab'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

        this.classList.add('active-tab');
        const tabId = this.getAttribute('data-tab');
        const tabSection = document.getElementById(tabId);
        if (tabSection) tabSection.classList.remove('hidden');

        // Only call setupAdminTab when admin tab is clicked
        if (tabId === 'create-admin') setupAdminTab();
        if (tabId === 'member-list') loadMembers();
        if (tabId === 'ledger-entry') loadMemberLedger();
        // ...other tab-specific loaders
      });
    });

    // Fetch Data Sections
 function fetchTable(endpoint, targetId, renderFn) {
  fetch(endpoint, {
    headers: {
      'Authorization':  `Bearer ${localStorage.getItem('adminToken')}`
    }
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error(`Invalid JSON from ${endpoint}`);
      }

      if (!res.ok) {
        throw new Error(data.message || `Request failed: ${res.status}`);
      }

      if (!Array.isArray(data)) {
        console.error(`Expected array but got:`, data);
        return;
      }

      const tableBody = document.getElementById(targetId);
      if (!tableBody) {
        console.error(`Target element #${targetId} not found.`);
        return;
      }

      tableBody.innerHTML = data.map(renderFn).join('');
    })
    .catch(err => {
      console.error(`Error loading ${endpoint}:`, err.message || err);
      const tableBody = document.getElementById(targetId);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-red-500">${err.message}</td></tr>`;
      }
    });
}

// Fetch and render Monthly Summary
fetchTable('/admin/monthlysummary', 'summaryData', row => `
    <tr class="border-t">
      <td class="p-2">${row.period}</td>
      <td class="p-2">${formatAmount(row.openbalance)}</td>
      <td class="p-2">${formatAmount(row.Debitbalance)}</td>
      <td class="p-2">${formatAmount(row.Creditbalance)}</td>
      <td class="p-2">${formatAmount(row.Netbalance)}</td>
    </tr>
  `);

function loadMonthlySummary() {
  fetchTable('/admin/monthlysummary', 'summaryData', row => `
    <tr class="border-t">
      <td class="p-2">${row.period}</td>
      <td class="p-2">${formatAmount(row.openbalance)}</td>
      <td class="p-2">${formatAmount(row.Debitbalance)}</td>
      <td class="p-2">${formatAmount(row.Creditbalance)}</td>
      <td class="p-2">${formatAmount(row.Netbalance)}</td>
    </tr>
  `);
}

// Fetch and render OCDA Expenses
fetchTable('/admin/ocdaexpenses', 'expensesData', row => `
  <tr class="border-t">
    <td class="p-2">${formatDate(row.docdate)}</td>
    <td class="p-2">${row.project}</td>
    <td class="p-2">${row.remarks}</td>
    <td class="p-2">${formatAmount(row.amount)}</td>
  </tr>
`);

// Fetch and render Standard Expenses
  fetchTable('/admin/stdxpenses', 'stdData', row => `
    <tr class="border-t">
      <td data-field="expscode" contenteditable="false" class="p-2">${row.expscode}</td>
      <td data-field="expsdesc" contenteditable="false" class="p-2">${row.expsdesc}</td>
      <td class="p-2">
        <button class="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onclick="editStdExpense('${row.expscode}', this)">Edit</button>
        <button class="px-2 py-1 bg-red-600 text-white rounded text-xs" onclick="deleteStdExpense('${row.expscode}')">Delete</button>
      </td>
    </tr>
  `);

document.getElementById('addStdExpenseForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const code = document.getElementById('newExpscode').value.trim();
  const desc = document.getElementById('newExpsdesc').value.trim();
  if (!code || !desc) return alert('Enter both code and description');
  try {
    const res = await fetch('/admin/stdxpenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expscode: code, expsdesc: desc })
    });
    if (res.ok) {
      document.getElementById('newExpscode').value = '';
      document.getElementById('newExpsdesc').value = '';
      fetchTable('/admin/stdxpenses', 'stdData', stdExpenseRowRender);
    } else {
      const result = await res.json();
      alert(result.error || 'Insert failed');
    }
  } catch (err) {
    console.error('Failed to add std expense:', err);
  }
});

function editStdExpense(code, btn) {
  const row = btn.closest('tr');
  const fields = row.querySelectorAll('[data-field]');
  const editing = btn.textContent === 'Save';
  if (editing) {
    // Save
    const body = {};
    fields.forEach(f => body[f.dataset.field] = f.textContent.trim());
    fetch(`/admin/stdxpenses?expscode=${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(res => {
      if (!res.ok) return alert('Update failed');
      alert('Saved successfully!');
      btn.textContent = 'Edit';
      fields.forEach(f => f.setAttribute('contenteditable', 'false'));
      fetchTable('/admin/stdxpenses', 'stdData', stdExpenseRowRender);
    });
  } else {
    // Enable editing
    fields.forEach(f => f.setAttribute('contenteditable', 'true'));
    btn.textContent = 'Save';
    alert('Editing is enabled. You can now modify the fields.');
  }
}

function deleteStdExpense(code) {
  if (!confirm('Delete this expense?')) return;
  fetch(`/admin/stdxpenses?expscode=${encodeURIComponent(code)}`, { method: 'DELETE' })
    .then(res => {
    if (!res.ok) return alert('Delete failed');
    alert('Deleted successfully!');
    fetchTable('/admin/stdxpenses', 'stdData', stdExpenseRowRender);
  });
}

// Helper for rendering rows (so you can reuse in fetchTable)
function stdExpenseRowRender(row) {
  return `
    <tr class="border-t">
      <td data-field="expscode" contenteditable="false" class="p-2">${row.expscode}</td>
      <td data-field="expsdesc" contenteditable="false" class="p-2">${row.expsdesc}</td>
      <td class="p-2">
        <button class="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onclick="editStdExpense('${row.expscode}', this)">Edit</button>
        <button class="px-2 py-1 bg-red-600 text-white rounded text-xs" onclick="deleteStdExpense('${row.expscode}')">Delete</button>
      </td>
    </tr>
  `;
}

// Fetch and render Income Classifications
fetchTable('/admin/incomeclass', 'incomeData', incomeClassRowRender);

// Handle form submission
document.getElementById('addIncomeClassForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const code = document.getElementById('newIncomecode').value.trim();
  const desc = document.getElementById('newIncomedesc').value.trim();
  if (!code || !desc) return alert('Enter both code and description');
  
  try {
    const res = await fetch('/admin/incomeclass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 
      'Authorization':  `Bearer ${localStorage.getItem('adminToken')}`
       },
      body: JSON.stringify({ incomecode: code, incomedesc: desc })
    });
    if (res.ok) {
      document.getElementById('newIncomecode').value = '';
      document.getElementById('newIncomedesc').value = '';
      fetchTable('/admin/incomeclass', 'incomeData', incomeClassRowRender);
    } else {
      const result = await res.json();
      alert(result.error || 'Insert failed');
    }
  } catch (err) {
    console.error('Failed to add income classification:', err);
  }
});

function editIncomeClass(code, btn) {
  const row = btn.closest('tr');
  const fields = row.querySelectorAll('[data-field]');
  const editing = btn.textContent === 'Save';

  if (editing) {
    const body = {};
    fields.forEach(f => body[f.dataset.field] = f.textContent.trim());

    // Only send incomedesc in body for update, as incomecode is used as query param
    fetch(`/admin/incomeclass?incomecode=${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incomedesc: body.incomedesc })
    }).then(res => {
      if (!res.ok) return alert('Update failed');
      alert('Saved successfully!');
      btn.textContent = 'Edit';
      fields.forEach(f => f.setAttribute('contenteditable', 'false'));
      fetchTable('/admin/incomeclass', 'incomeData', incomeClassRowRender);
    });
  } else {
    fields.forEach(f => f.setAttribute('contenteditable', 'true'));
    btn.textContent = 'Save';
    alert('Editing is enabled. You can now modify the fields.');
  }
}

function deleteIncomeClass(code) {
  if (!confirm('Delete this income class?')) return;
  fetch(`/admin/incomeclass?incomecode=${encodeURIComponent(code)}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) return alert('Delete failed');
      alert('Deleted successfully!');
      fetchTable('/admin/incomeclass', 'incomeData', incomeClassRowRender);
    });
}

// Table row renderer
function incomeClassRowRender(row) {
  return `
    <tr class="border-t">
      <td data-field="incomecode" contenteditable="false" class="p-2">${row.incomecode}</td>
      <td data-field="incomedesc" contenteditable="false" class="p-2">${row.incomedesc}</td>
      <td class="p-2">
        <button class="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onclick="editIncomeClass('${row.incomecode}', this)">Edit</button>
        <button class="px-2 py-1 bg-red-600 text-white rounded text-xs" onclick="deleteIncomeClass('${row.incomecode}')">Delete</button>
      </td>
    </tr>
  `;
}




// Logout
function adminLogout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/adminlog.html';
}

// Init
window.addEventListener('DOMContentLoaded', loadAdmins);

    // Create New Member (Screen G)
document.getElementById('createMemberForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    PhoneNumber: form.PhoneNumber.value,
    phoneno2: form.phoneno2.value,
    Surname: form.Surname.value,
    othernames: form.othernames.value,
    Title: form.Title.value,
    HonTitle: form.HonTitle.value,
    Sex: form.Sex.value,
    Quarters: form.Quarters.value,
    Ward: form.Ward.value,
    State: form.State.value,
    Town: form.Town.value,
    DOB: form.DOB.value,
    Qualifications: form.Qualifications.value,
    Profession: form.Profession.value,
    exitdate: form.exitdate.value,
    Password: form.Password.value,
    email: form.email.value
    // `CreatedAt` and `createdby` are set on backend
  };

  try {
    const res = await fetch('/admin/createmember', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(res.ok ? 'Member created successfully!' : (result.message || 'Error creating member.'));
    if (res.ok) form.reset(); loadMembers(); // Refresh member list after creation
  } catch (err) {
    console.error('Create Member Error:', err);
    alert('Server error');
  }
});

//show the member list
/*let allMembers = [];
let currentPage = 1;
const rowsPerPage = 10;*/

function displayMembers(data) {
  const table = document.getElementById('membersTable');
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginated = data.slice(start, end);

table.innerHTML = paginated.map(m => `
  <tr class="border-t">
    <td class="p-3">${m.PhoneNumber}</td>
    <td class="p-3">${m.Surname}</td>
    <td class="p-3">${m.othernames}</td>
    <td class="p-3">${m.Title}</td>
    <td class="p-3">${m.Sex}</td>
    <td class="p-3">${m.Quarters}</td>
    <td class="p-3">${m.Ward}</td>
    <td class="p-3 flex flex-col gap-2">
      <button onclick="viewMember('${m.PhoneNumber}')" class="bg-blue-500 text-white px-2 py-1 rounded text-xs">View</button>
      <button onclick="editMember('${m.PhoneNumber}')" class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
      <button onclick="deleteMember('${m.PhoneNumber}')" class="bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button>
    </td>
  </tr>
`).join('');
  renderPagination(data.length);
}

function renderPagination(total) {
  const pages = Math.ceil(total / rowsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  for (let i = 1; i <= pages; i++) {
    pagination.innerHTML += `
      <button class="px-3 py-1 border rounded ${i === currentPage ? 'bg-blue-500 text-white' : ''}"
      onclick="goToPage(${i})">${i}</button>`;
  }
}

function goToPage(page) {
  currentPage = page;
  const filtered = filterMembers(document.getElementById('memberSearch').value);
  displayMembers(filtered);
}

function filterMembers(query) {
  return allMembers.filter(m => {
    const q = query.toLowerCase();
    return Object.values(m).some(val => String(val).toLowerCase().includes(q));
  });
}

document.getElementById('memberSearch').addEventListener('input', (e) => {
  currentPage = 1;
  displayMembers(filterMembers(e.target.value));
});

async function loadMembers() {
  try {
    const token =  `Bearer ${localStorage.getItem('adminToken')}`
    const res = await fetch('/admin/members', {
      headers: { 'Authorization': token }
    });

    allMembers = await res.json();
    displayMembers(allMembers);
  } catch (err) {
    console.error('Member Load Error:', err);
    document.getElementById('membersTable').innerHTML = `<tr><td colspan="9">Failed to load members</td></tr>`;
  }
} 

window.addEventListener('DOMContentLoaded', () => {
  //loadEnquiryDropdowns?.();
  loadMembers(); // 👈 ensure this is called
});


// Fetch and render Members Summary Table (Quarters x Wards)
async function loadMembersSummaryTable(targetBoxId = 'summaryTableBox') {
  const token = localStorage.getItem('adminToken');
  const box = document.getElementById(targetBoxId);
  if (!token || !box) return;
  box.innerHTML = '<div class="text-gray-500">Loading summary...</div>';

  try {
    const res = await fetch(`${BASE_URL}/admin/members-summary`, {
      headers: { 'Authorization':  `Bearer ${localStorage.getItem('adminToken')}`}
    });
    if (!res.ok) throw new Error('Failed to fetch summary');
    const { wards, quarters, data, wardTotals, quarterTotals, grandTotal } = await res.json();

    if (!wards?.length || !quarters?.length) {
      box.innerHTML = '<div class="text-gray-500">No data found.</div>';
      return;
    }

    // Create a mapping of quarters to their specific wards
    const groupedByQuarter = {};
    const members = Object.keys(data);
    members.forEach(ward => {
      quarters.forEach(quarter => {
        if ((data[ward]?.[quarter] ?? 0) > 0) {
          if (!groupedByQuarter[quarter]) groupedByQuarter[quarter] = [];
          groupedByQuarter[quarter].push(ward);
        }
      });
    });

    let html = '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">';

    // Render all ward cards individually
    wards.forEach(ward => {
      if (wardTotals?.[ward] !== undefined) {
        html += `
          <div class="bg-white border border-blue-300 shadow-lg rounded-lg p-5 transform transition duration-500 hover:scale-105 hover:shadow-2xl">
            <div class="flex items-center space-x-4">
              <div class="bg-blue-100 text-blue-700 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h5" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-blue-900">${ward}</h3>
                <p class="text-sm text-blue-600"> <span class="font-bold">${wardTotals[ward]}</span></p>
              </div>
            </div>
          </div>`;
      }
    });
    html += '</div>';

    // Render each quarter card with its wards
    /*html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">';
    Object.entries(groupedByQuarter).forEach(([quarter, wardList]) => {
      html += `
        <div class="bg-white border-l-4 border-blue-500 shadow-md rounded-lg p-4 transition-transform duration-500 hover:scale-105">
          <h3 class="text-xl font-bold text-blue-800 mb-3">${quarter}</h3>
          <div class="space-y-2">`;
      wardList.forEach(ward => {
        html += `
            <div class="flex justify-between text-sm text-gray-700 border-b pb-1">
              <span class="font-medium">${ward}</span>
              <span class="font-semibold text-green-700">${data?.[ward]?.[quarter] ?? 0}</span>
            </div>`;
      });
      html += `
            <div class="flex justify-between font-bold border-t pt-2 mt-3 text-blue-900">
              <span>Quarter Total</span>
              <span>${quarterTotals?.[quarter] ?? 0}</span>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';*/

    html += `<div class="mt-10 text-right font-extrabold text-3xl text-gray-700 animate-pulse">Grand Total: ${grandTotal ?? 0}</div>`;
    box.innerHTML = html;

  } catch (err) {
    box.innerHTML = `<div class="text-red-500">Error loading summary table</div>`;
    console.error('Members Summary Table Error:', err);
  }
}
// Ensure summary table loads on login and on refresh 
window.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('membersSummaryTableBox')) {
    loadMembersSummaryTable('membersSummaryTableBox');
  } else if (document.getElementById('summaryTableBox')) {
    loadMembersSummaryTable('summaryTableBox');
  }
});

// Export to Excel or PDF
function exportMembers(type) {
  const table = document.getElementById('memberTableExport');
  if (type === 'excel') {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Members" });
    XLSX.writeFile(wb, "members.xlsx");
  } else if (type === 'pdf') {
    const doc = new jspdf.jsPDF();
    doc.autoTable({ html: '#memberTableExport' });
    doc.save("members.pdf");
  }
}

// Show and populate member detail section
async function viewMember(phone) {
  originalPhone = phone;

  try {
    const res = await fetch(`/admin/member/${phone}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch member');

    const member = await res.json();

    // Hide the edit form and show the view-only div
    document.getElementById('memberEditForm').style.display = 'none';
    const viewDiv = document.getElementById('memberViewOnly');
    viewDiv.classList.remove('hidden');

    // Fill all view fields
    document.getElementById('viewPhone').innerText = member.PhoneNumber || '';
    document.getElementById('viewPhone2').innerText = member.phoneno2 || '';
    document.getElementById('viewSurname').innerText = member.Surname || '';
    document.getElementById('viewOthernames').innerText = member.othernames || '';
    document.getElementById('viewTitle').innerText = member.Title || '';
    document.getElementById('viewHonTitle').innerText = member.HonTitle || '';
    document.getElementById('viewSex').innerText = member.Sex || '';
    document.getElementById('viewQuarters').innerText = member.Quarters || '';
    document.getElementById('viewWard').innerText = member.Ward || '';
    document.getElementById('viewState').innerText = member.State || '';
    document.getElementById('viewTown').innerText = member.Town || '';
    document.getElementById('viewDOB').innerText = member.DOB ? member.DOB.split('T')[0] : '';
    document.getElementById('viewExit').innerText = member.exitdate ? member.exitdate.split('T')[0] : '';
    document.getElementById('viewQualifications').innerText = member.Qualifications || '';
    document.getElementById('viewProfession').innerText = member.Profession || '';
    document.getElementById('viewEmail').innerText = member.email || '';

    // Hide save button while viewing
    document.getElementById('updateMemberBtn')?.classList.add('hidden');
    document.getElementById('memberDetails')?.classList.remove('hidden');

    window.scrollTo({
      top: document.getElementById('memberDetails').offsetTop,
      behavior: 'smooth'
    });

  } catch (err) {
    console.error('View member error:', err);
    alert('Could not load member details.');
  }
}


let originalMemberData = {}; // global to hold the original data

async function editMember(phone) {
  originalPhone = phone;

  try {
    const res = await fetch(`/admin/member/${phone}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch member');

    const member = await res.json();
    originalMemberData = { ...member }; // Save original data for comparison
    const form = document.getElementById('memberEditForm');

    // Hide the view-only div and show the edit form
    document.getElementById('memberViewOnly').classList.add('hidden');
    form.style.display = '';

    // Fill form and enable inputs for editing
    for (const key in member) {
      if (form.elements[key]) {
        if (key === 'DOB' || key === 'exitdate') {
          // Format date for input type="date"
          form.elements[key].value = member[key] ? member[key].split('T')[0] : '';
        } else {
          form.elements[key].value = member[key] ?? '';
        }
        form.elements[key].disabled = false;
      }
    }

    // Show the update button when editing
    document.getElementById('updateMemberBtn')?.classList.remove('hidden');
    document.getElementById('memberDetails')?.classList.remove('hidden');

    window.scrollTo({
      top: document.getElementById('memberDetails').offsetTop,
      behavior: 'smooth'
    });

  } catch (err) {
    console.error('Edit member error:', err);
    alert('Could not load member for editing.');
  }
}


function closeMemberDetails() {
  const form = document.getElementById('memberEditForm');
  form.reset();
  [...form.elements].forEach(el => el.disabled = false);
  document.getElementById('memberDetails').classList.add('hidden');
  document.getElementById('updateMemberBtn')?.classList.add('hidden');
}

// Save changes
async function saveMemberChanges() {
  const form = document.getElementById('memberEditForm');
  const formData = Object.fromEntries(new FormData(form));
  const newPhone = formData.PhoneNumber.trim();

  // Only include changed fields
  const changedData = {};
  for (const key in formData) {
    if (formData[key] !== String(originalMemberData[key] ?? '')) {
      changedData[key] = formData[key];
    }
  }

  // If nothing changed, do nothing
  if (Object.keys(changedData).length === 0) {
    alert('No changes detected.');
    return;
  }

  // 🔒 Confirm if main phone number was changed
  if (changedData.PhoneNumber && changedData.PhoneNumber !== originalPhone) {
    const confirmChange = confirm(
      `You changed the primary phone number from ${originalPhone} to ${changedData.PhoneNumber}. This may affect member identity.\n\nDo you want to proceed?`
    );
    if (!confirmChange) return;
  }

  // 🔎 Check if new phone number already exists
  if (changedData.PhoneNumber && changedData.PhoneNumber !== originalPhone) {
    try {
      const checkRes = await fetch(`/admin/member/${changedData.PhoneNumber}`, {
        headers: { 'Authorization': localStorage.getItem('adminToken') }
      });
      if (checkRes.ok) {
        alert(`A member already exists with phone number: ${changedData.PhoneNumber}`);
        return;
      }
    } catch (err) {
      // Not found is OK
    }
  }

  // 🔄 Proceed with update
  try {
    const res = await fetch(`/admin/member/${originalPhone}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(changedData)
    });

    const result = await res.json();
    alert(res.ok ? 'Member updated successfully!' : result.message || 'Update failed');
    if (res.ok) {
      loadMembers();
      closeMemberDetails();
    }
  } catch (err) {
    console.error('Save error:', err);
    alert('Error saving changes');
  }
}

async function deleteMember(phone) {
  if (!confirm('Are you sure you want to delete this member?')) return;
  try {
    const res = await fetch(`/admin/member/${phone}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const result = await res.json();
    if (res.ok) {
      alert('Member deleted successfully');
      // Optionally reload the member list or remove the row from the table
      location.reload();
    } else {
      alert(result.message || 'Failed to delete member');
    }
  } catch (err) {
    alert('Server error');
  }
}

//Load phone numbers
async function loadPhoneNumbers() {
  try {
    const res = await fetch('/admin/members', {
      headers: { 'Authorization':  `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const members = await res.json();
    const datalist = document.getElementById('phonenoList');
    datalist.innerHTML = members.map(
      m => `<option value="${m.PhoneNumber}">${m.Surname} ${m.othernames}</option>`
    ).join('');
  } catch (err) {
    console.error('Failed to load phone numbers', err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadPhoneNumbers();
});

document.addEventListener('DOMContentLoaded', function() {
  // Populate Income Classification dropdown for ledger entry
  const remarkDropdown = document.getElementById('remarkDropdown');
  if (remarkDropdown) {
    fetch('/admin/incomeclass', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      // Clear existing options except first
      while (remarkDropdown.options.length > 1) {
        remarkDropdown.remove(1);
      }
      if (Array.isArray(data)) {
        data.forEach(item => {
          const option = document.createElement('option');
          option.value = `${item.incomedesc} (${item.incomecode})`;
          option.textContent = `${item.incomedesc} (${item.incomecode})`;
          remarkDropdown.appendChild(option);
        });
      }
    })
    .catch(err => {
      console.error('Failed to load income classifications:', err);
    });
  }
});

//  Add Payment to Member Ledger (Screen D)
document.getElementById('ledgerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    phoneno: form.phoneno.value,
    transdate: form.transdate.value,
    amount: parseFloat(form.amount.value),
    remark: form.remark.value,
  };

  console.log('Submitting ledger entry for:', data);

  const today = new Date().toISOString().split('T')[0];
  if (data.transdate > today) {
    alert("Transaction date cannot be in the future.");
    return;
  }


  try {
    const res = await fetch(`/admin/ledger-entry/${data.phoneno}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization':  `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(res.ok ? 'Ledger entry recorded!' : (result.message || 'Error submitting ledger entry.'));
    if (res.ok) form.reset();
    loadMemberLedger();
  } catch (err) {
    console.error('Ledger Error:', err.message || err);
    alert('Server error');
  }
});

// Add member ledger to (Screen D)
async function loadMemberLedger() {
  try {
    const res = await fetch('/admin/memberledger', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`

      }
    });
    const data = await res.json();
    const body = document.getElementById('ledgerData');
    body.innerHTML = data.map(row =>`
        <tr class="border-t">
          <td class="p-2">${row.phoneno}</td>
          <td class="p-2">${formatDate(row.transdate)}</td>
          <td class="p-2">${formatAmount(row.amount)}</td>
          <td class="p-2">${row.remark}</td>
          <td class="p-2">${row.paydate || '—'}</td>
        `).join('');
  } catch (err) {
    console.error('Load memberLedger Error:', err);
  }
}



// Add OCDA Expense (Screen E)
document.getElementById('ocdaForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    docdate: form.docdate.value,
    project: form.project.value,
    amount: parseFloat(form.amount.value),
    remarks: form.remarks.value
  };

  try {
    const res = await fetch('/admin/ocdaexpenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(res.ok ? 'Saved successfully!' : (result.message || 'Error saving data'));
    if (res.ok) {
      form.reset();
      loadOCDAExpenses(); // refresh display
    }
  } catch (err) {
    console.error('OCDA Submit Error:', err.message || err);
    alert('Server error');
  }
});

async function loadProjectDropdown() {
  try {
    const res = await fetch('/admin/stdxpenses');
    const projects = await res.json();
    const dropdown = document.getElementById('projectDropdown');
    dropdown.innerHTML = projects.map(
      p => `<option value="${p.expscode}">${p.expsdesc} (${p.expscode})</option>`
    ).join('');
  } catch (err) {
    console.error('Project List Load Error:', err);
  }
} window.addEventListener('DOMContentLoaded', () => {
  loadProjectDropdown();
});


//render ocda update
async function loadOCDAExpenses() {
  try {
    const res = await fetch('/admin/ocdaexpenses', {
      headers: {
        'Authorization':  `Bearer ${localStorage.getItem('adminToken')}`
      }
    });
    const data = await res.json();
    const body = document.getElementById('ocdaTableBody');
    body.innerHTML = data.map(row => `
      <tr class="border-t">
        <td class="p-2">${row.docdate?.split('T')[0]}</td>
        <td class="p-2">${row.project}</td>
        <td class="p-2">${row.remarks}</td>
        <td class="p-2">₦${parseFloat(row.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Load OCDA Expenses Error:', err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadOCDAExpenses();
});



//  Monthly Summary Update (Screen F)
document.getElementById('summaryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const year = form.year.value;
  const month = form.month.value.padStart(2, '0'); // 🔒 ensure "01" not "1"

  const data = { year, month };

  try {
    const res = await fetch('/admin/generate-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(res.ok
      ? `✅ Summary for ${year}-${month} generated!`
      : (result.message || '❌ Error generating summary.'));

    if (res.ok) {
      form.reset();
      loadMonthlySummary?.(); // refresh if function exists
    }
  } catch (err) {
    console.error('Summary Error:', err);
    alert('⚠️ Server error. Please try again.');
  }
});

//enquiry dropdown
async function loadEnquiryDropdowns() {
  try {
    const res = await fetch('/admin/enquiry/options', {
      headers: { 'Authorization':  `Bearer ${localStorage.getItem('adminToken')}` }
    });
    const result = await res.json();

    // Populate dropdowns
    const memberSelect = document.getElementById('enquiry-member');
    const wardSelect = document.getElementById('enquiry-ward');
    const quarterSelect = document.getElementById('enquiry-quarter');

    result.members.forEach(m => {
      memberSelect.innerHTML += `<option value="${m.PhoneNumber}">${m.fullname} (${m.PhoneNumber})</option>`;
    });

    result.wards.forEach(w => {
      wardSelect.innerHTML += `<option value="${w}">${w}</option>`;
    });

    result.quarters.forEach(q => {
      quarterSelect.innerHTML += `<option value="${q}">${q}</option>`;
    });
  } catch (err) {
    console.error('Failed to load enquiry dropdowns', err);
  }
}
window.addEventListener('DOMContentLoaded', () => {
  loadAdmins();
  loadEnquiryDropdowns();
});




// Enquiry System (Screen H)
// Toggle dropdowns based on radio selection
document.querySelectorAll('input[name="enquiryType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const type = radio.value;

    ['member', 'ward', 'quarter'].forEach(t => {
      const group = document.getElementById(`${t}SelectGroup`);
      group.classList.toggle('hidden', t !== type);
    });

    // Clear dropdown selections
    document.getElementById('enquiry-member').value = 'ALL';
    document.getElementById('enquiry-ward').value = 'ALL';
    document.getElementById('enquiry-quarter').value = 'ALL';
  });
});

//  Submit Enquiry
document.getElementById('enquiryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const type = form.enquiryType.value;
  const mode = form.detail.checked ? 'detail' : 'summary';
  const start = form.start.value;
  const end = form.end.value;

  //  Grab the right param based on visible group
  let value = 'ALL';
  if (type === 'member') {
    value = document.getElementById('enquiry-member').value;
  } else if (type === 'ward') {
    value = document.getElementById('enquiry-ward').value;
  } else if (type === 'quarter') {
    value = document.getElementById('enquiry-quarter').value;
  }

  const params = new URLSearchParams({ type, param: value, mode });
  if (start) params.append('start', start);
  if (end) params.append('end', end);

  try {
    const res = await fetch(`/admin/enquiry?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
 }
    });
    const result = await res.json();

    if (!res.ok) return alert(result.message || 'Enquiry failed.');

    // 👇 CALL IT HERE, passing type and mode!
    renderEnquiryResults(result, type, mode);
  } catch (err) {
    console.error('Enquiry Error:', err);
    alert('Server error');
  }
});

//  Render Results 
function renderEnquiryResults(data, type, mode) {
  const summary = Array.isArray(data.summary) ? data.summary : [];
  const detail = Array.isArray(data.detail) ? data.detail : [];

  const wrapper = document.getElementById('enquiryTableWrapper');
  const container = document.getElementById('enquiryResults');
  container.classList.remove('hidden');

  // --- SUMMARY TABLE ---
let summaryHtml = '';
if (type === 'member') {
  summaryHtml = `
    <table class="w-full border border-gray-400 mb-6 shadow-sm" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Phone Number</th>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Name</th>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Total</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map(row => `
          <tr>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.PhoneNumber || row.phoneno || ''}</td>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.fullname || ''}</td>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
} else if (type === 'ward') {
  summaryHtml = `
    <table class="w-full border border-gray-400 mb-6 shadow-sm" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Ward</th>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Total</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map(row => `
          <tr>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.Ward || ''}</td>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
} else if (type === 'quarter') {
  summaryHtml = `
    <table class="w-full border border-gray-400 mb-6 shadow-sm" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Quarter</th>
          <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Total</th>
        </tr>
      </thead>
      <tbody>
        ${summary.map(row => `
          <tr>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.Quarters || row.Quarter || ''}</td>
            <td class="border border-gray-400 px-4 py-2 text-center">${row.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// --- DETAIL TABLE ---
let detailHtml = '';
if (mode === 'detail') {
  if (type === 'member') {
    const grouped = {};
    detail.forEach(tx => {
      if (!grouped[tx.phoneno]) grouped[tx.phoneno] = [];
      grouped[tx.phoneno].push(tx);
    });
    detailHtml = Object.entries(grouped).map(([phoneno, txs]) => `
      <div class="mb-8">
        <div class="font-bold text-lg mb-2">${phoneno} - ${txs[0]?.fullname || ''}</div>
        <table class="w-full border border-gray-400 shadow-sm" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Date</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Amount</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Remark</th>
            </tr>
          </thead>
          <tbody>
            ${txs.map(tx => `
              <tr>
                <td class="border border-gray-400 px-4 py-2 text-center">${tx.transdate}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${tx.amount}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${tx.remark}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
  } else if (type === 'ward') {
    detailHtml = detail.map(w => `
      <div class="mb-8">
        <div class="font-bold text-blue-600 text-lg mb-2">Ward: ${w.ward}</div>
        <table class="w-full border border-gray-400 shadow-sm" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Phone</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Name</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Date</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Amount</th>
              <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Remark</th>
            </tr>
          </thead>
          <tbody>
            ${(Array.isArray(w.members) ? w.members : []).map(m => `
              <tr>
                <td class="border border-gray-400 px-4 py-2 text-center">${m.phoneno}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${m.fullname}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${m.transdate}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${m.amount}</td>
                <td class="border border-gray-400 px-4 py-2 text-center">${m.remark}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
  } else if (type === 'quarter') {
    detailHtml = detail.map(q => `
      <div class="mb-10">
        <div class="text-xl text-indigo-700 font-bold mb-3">Quarter: ${q.quarter}</div>
        ${q.wards.map(w => `
          <div class="ml-4 mb-6">
            <div class="font-semibold text-lg text-blue-500 mb-2">Ward: ${w.ward}</div>
            <table class="w-full border border-gray-400 shadow-sm" style="border-collapse: collapse;">
              <thead>
                <tr>
                  <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Phone</th>
                  <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Name</th>
                  <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Date</th>
                  <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Amount</th>
                  <th class="border border-gray-400 px-4 py-2 text-center bg-gray-100">Remark</th>
                </tr>
              </thead>
              <tbody>
                ${(Array.isArray(w.members) ? w.members : []).map(m => `
                  <tr>
                    <td class="border border-gray-400 px-4 py-2 text-center">${m.phoneno}</td>
                    <td class="border border-gray-400 px-4 py-2 text-center">${m.fullname}</td>
                    <td class="border border-gray-400 px-4 py-2 text-center">${m.transdate}</td>
                    <td class="border border-gray-400 px-4 py-2 text-center">${m.amount}</td>
                    <td class="border border-gray-400 px-4 py-2 text-center">${m.remark}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          `).join('')}
        </div>
    `).join('');
  }
}

  wrapper.innerHTML = `
  <div class="flex flex-col lg:flex-row gap-6 items-start">
      <div class="w-full lg:w-1/2">
        ${summaryHtml}
      </div>
      <div class="w-full lg:w-1/2">
        ${detailHtml}
      </div>
    </div>
  `;

  // Prepare hidden export table
  const allRows = [...summary, ...detail];
  if (allRows.length > 0) {
    const headers = Object.keys(allRows[0]);
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const dataRows = allRows.map(row =>
      `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    document.getElementById('enquiryTableExport').innerHTML = `
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
    `;

  } else {
    document.getElementById('enquiryTableExport').innerHTML = '';
  }
}


// Export
function exportEnquiry(type) {
  const table = document.getElementById('enquiryTableExport');
  if (type === 'excel') {
    const wb = XLSX.utils.table_to_book(table, { sheet: "Enquiry" });
    XLSX.writeFile(wb, "enquiry.xlsx");
  } else if (type === 'pdf') {
    const doc = new jspdf.jsPDF();
    doc.autoTable({ html: '#enquiryTableExport' });
    doc.save("enquiry.pdf");
  }
}

//  Print
function printEnquiry() {
  const content = document.getElementById('enquiryTableWrapper').innerHTML;
  const win = window.open('', '', 'width=900,height=700');
  win.document.write('<html><head><title>Print Enquiry</title></head><body>');
  win.document.write(content);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}


async function loadOCDAExpensesAnalysis({ start = '', end = '', code = 'ALL', mode = 'summary' } = {}) {
  try {
    const params = new URLSearchParams({ start, end, code, mode });
    const res = await fetch(`/admin/ocda-expenses-analysis?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
    });
    const data = await res.json();
    renderOCDAExpensesAnalysis(data, mode);
  } catch (err) {
    console.error('Failed to load OCDA Expenses Analysis:', err);
    document.getElementById('ocdaExpensesAnalysisTable').innerHTML = '<tr><td colspan="5">Failed to load data</td></tr>';
  }
}


function renderOCDAExpensesAnalysis(data, mode) {
  const table = document.getElementById('ocdaExpensesAnalysisTable');
  if (!Array.isArray(data) || data.length === 0) {
    table.innerHTML = '<div>No data found</div>';
    return;
  }

  if (mode === 'summary') {
    table.innerHTML = `
      <table class="min-w-full border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 border">Code</th>
            <th class="p-2 border">Description</th>
            <th class="p-2 border">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td class="p-2 border text-center">${row.code}</td>
              <td class="p-2 border text-center">${row.description}</td>
              <td class="p-2 border text-center">${formatAmount(row.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;}else {
    // Detail: Grouped table with expand/collapse
    const grouped = {};
    data.forEach(row => {
      const key = `${row.description} (${row.code})`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    table.innerHTML = Object.entries(grouped).map(([heading, rows], index) => `
      <div class="mb-4 border rounded overflow-hidden shadow">
        <button class="w-full text-left px-4 py-2 bg-gray-100 font-bold" onclick="toggleGroup(${index})">
          ${heading}
        </button>
        <div id="group-${index}" class="hidden px-4 py-2">
          <table class="w-full border border-gray-400" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th class="border px-2 py-1 text-center bg-gray-200">Date</th>
                <th class="border px-2 py-1 text-center bg-gray-200">Remark</th>
                <th class="border px-2 py-1 text-center bg-gray-200">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td class="border px-2 py-1 text-center">${formatDate(row.date)}</td>
                  <td class="border px-2 py-1 text-center">${row.remark || ''}</td>
                  <td class="border px-2 py-1 text-center">${formatAmount(row.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `).join('');
  }
}

// ✅ Add this outside the render function
function toggleGroup(index) {
  const section = document.getElementById(`group-${index}`);
  if (section) section.classList.toggle('hidden');
}

//export to pdf
function exportOCDAReportToPDF() {
  const element = document.getElementById('ocdaExpensesAnalysisTable');
  html2pdf().set({
    margin: 0.5,
    filename: 'OCDA_Expenses_Analysis.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(element).save();
}



document.getElementById('ocdaExpensesAnalysisForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.mode.value;
  const start = form.start.value;
  const end = form.end.value;
  const code = form.code.value || 'ALL';
  loadOCDAExpensesAnalysis({ start, end, code, mode });
});

// ===== OCDA Income Analysis Report (Screen J) =====
async function loadOCDAIncomeAnalysis({ start = '', end = '', code = 'ALL', mode = 'summary' } = {}) {
  try {
    const params = new URLSearchParams({ start, end, code, mode });
    const res = await fetch(`/admin/ocda-income-analysis?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
 }
    });
    const data = await res.json();
    renderOCDAIncomeAnalysis(data, mode);
  } catch (err) {
    console.error('Failed to load OCDA Income Analysis:', err);
    document.getElementById('ocdaIncomeAnalysisTable').innerHTML = '<tr><td colspan="5">Failed to load data</td></tr>';
  }
}

function renderOCDAIncomeAnalysis(data, mode) {
  const table = document.getElementById('ocdaIncomeAnalysisTable');
  if (!Array.isArray(data) || data.length === 0) {
    table.innerHTML = '<tr><td colspan="5">No data found</td></tr>';
    return;
  }
  if (mode === 'summary') {
    table.innerHTML = data.map(row => `
      <tr class="border-t">
        <td class="p-2">${row.code}</td>
        <td class="p-2">${row.description}</td>
        <td class="p-2">${formatAmount(row.amount)}</td>
      </tr>
    `).join('');
  } else {
    table.innerHTML = data.map(row => `
      <tr class="border-t">
        <td class="p-2">${formatDate(row.date)}</td>
        <td class="p-2">${row.remark}</td>
        <td class="p-2">${formatAmount(row.amount)}</td>
      </tr>
    `).join('');
  }
}

document.getElementById('ocdaIncomeAnalysisForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.mode.value;
  const start = form.start.value;
  const end = form.end.value;
  const code = form.code.value || 'ALL';
  loadOCDAIncomeAnalysis({ start, end, code, mode });
});


// Account Summary (View Member Ledger)

function showAccountSummary() {
  // Hide all tab content and show this one
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.getElementById('account-summary').classList.remove('hidden');

  // Fetch and render account summary data
  fetchTable('/admin/memberledger', 'accountSummaryData', row => `
    <tr class="border-t">
      <td class="p-2">${row.phoneno}</td>
      <td class="p-2">${formatDate(row.transdate)}</td>
      <td class="p-2">${formatAmount(row.amount)}</td>
      <td class="p-2">${row.remark}</td>
      <td class="p-2">${formatDate(row.paydate)}</td>     
    </tr>
  `);
}

// admin-static tables
const staticTypes = ['titles', 'qualifications', 'wards', 'hontitles'];

async function loadStaticTable(type) {
  try {
    const tableBodyId = {
      titles: 'titlesTableBody',
      qualifications: 'qualificationsTableBody',
      wards: 'wardsTableBody',
      hontitles: 'hontitlesTableBody'
    }[type];

    const listEl = document.getElementById(tableBodyId);
    if (!listEl) {
      console.error(`Element with id ${tableBodyId} not found for type ${type}`);
      return;
    }

    const res = await fetch(`/admin/static/${type}`);
    const data = await res.json();

    listEl.innerHTML = data.map(row => {
      // Use Id if present, else use composite keys
      if (type === 'wards') {
        // Use both ward and Quarter as keys if Id is missing
        const key = row.Id !== undefined ? row.Id : `${encodeURIComponent(row.ward)}|${encodeURIComponent(row.Quarter)}`;
        return `<tr data-id="${key}" class="hover:bg-gray-50">
          <td data-field="ward" contenteditable="false" class="text-center py-2 px-3 border border-gray-300">${row.ward || ''}</td>
          <td data-field="Quarter" contenteditable="false" class="text-center py-2 px-3 border border-gray-300">${row.Quarter || ''}</td>
          <td class="text-center py-2 px-3 border border-gray-300">
            <div class="flex justify-center gap-4">
              <button class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs" onclick="editRow('wards', '${row.ward}', '${row.Quarter}', this)">Edit</button>
              <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs" onclick="deleteRow('wards', '${row.ward}', '${row.Quarter}')">Delete</button>
            </div>
          </td>
        </tr>`;
      } else if (type === 'hontitles') {
        // Use both Htitle and titlerank as keys if Id is missing
        const key = row.Id !== undefined ? row.Id : `${encodeURIComponent(row.Htitle)}|${encodeURIComponent(row.titlerank)}`;
        return `<tr data-id="${key}" class="hover:bg-gray-50">
          <td data-field="Htitle" contenteditable="false" class="text-center py-2 px-3 border border-gray-300">${row.Htitle || ''}</td>
          <td data-field="titlerank" contenteditable="false" class="text-center py-2 px-3 border border-gray-300">${row.titlerank || ''}</td>
          <td class="text-center py-2 px-3 border border-gray-300">
            <div class="flex justify-center gap-4">
              <button class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs" onclick="editRow('hontitles', '${row.Htitle}', '${row.titlerank}', this)">Edit</button>
              <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs" onclick="deleteRow('hontitles', '${row.Htitle}', '${row.titlerank}')">Delete</button>
            </div>
          </td>
        </tr>`;
      } else {
        // Titles and Qualifications
        const fieldMap = {
          titles: 'title',
          qualifications: 'qualification',
        };
        const field = fieldMap[type];
        const key = row.Id !== undefined ? row.Id : encodeURIComponent(row[field]);
        return `<tr data-id="${key}" class="hover:bg-gray-50">
          <td data-field="${field}" contenteditable="false" class="text-center py-2 px-3 border border-gray-300">${row[field] || ''}</td>
          <td class="text-center py-2 px-3 border border-gray-300">
            <div class="flex justify-center gap-4">
              <button class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs" onclick="editRow('${type}', '${row[field]}', null, this)">Edit</button>
              <button class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs" onclick="deleteRow('${type}', '${row[field]}')">Delete</button>
            </div>
          </td>
        </tr>`;
      }
    }).join('');
  } catch (err) {
    console.error(`Failed to load ${type}:`, err);
  }
}

async function addStaticValue(type) {
  const field = type.slice(0, -1);

  if (type === 'wards') {
    const ward = document.getElementById('newWard').value.trim();
    const quarter = document.getElementById('newQuarter').value.trim();
    if (!ward || !quarter) return alert('Enter both ward and quarter');
    var body = { ward, Quarter: quarter };
  } else if (type === 'hontitles') {
    const htitle = document.getElementById('newHtitle').value.trim();
    const titlerank = document.getElementById('newTitlerank')?.value.trim() || '';
    if (!htitle) return alert('Enter Hon Title');
    var body = { Htitle: htitle, titlerank };
  } else {
    const input = document.getElementById(`new${capitalize(field)}`);
    const value = input.value.trim();
    if (!value) return alert('Enter a value');
    var body = { [field]: value };
  }

  try {
    const res = await fetch(`/admin/static/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      if (type === 'wards') {
        document.getElementById('newWard').value = '';
        document.getElementById('newQuarter').value = '';
      } else if (type === 'hontitles') {
        document.getElementById('newHtitle').value = '';
        document.getElementById('newTitlerank') && (document.getElementById('newTitlerank').value = '');
      } else {
        document.getElementById(`new${capitalize(field)}`).value = '';
      }
      loadStaticTable(type);
    } else {
      const result = await res.json();
      alert(result.error || 'Insert failed');
    }
  } catch (err) {
    console.error(`Failed to insert into ${type}:`, err);
  }
}

// Edit Row for all static tables
function editRow(type, key1, key2, btn) {
  const row = btn.closest('tr');
  const fields = row.querySelectorAll('[data-field]');
  const editing = btn.textContent === 'Save';

  if (editing) {
    // Save changes
    const body = {};
    fields.forEach(f => body[f.dataset.field] = f.textContent.trim());

    let url = `/admin/static/${type}`;
    let params = '';

    if (type === 'wards') {
      params = `?ward=${encodeURIComponent(key1)}&Quarter=${encodeURIComponent(key2)}`;
    } else if (type === 'hontitles') {
      params = `?Htitle=${encodeURIComponent(key1)}&titlerank=${encodeURIComponent(key2)}`;
    } else {
      params = `?value=${encodeURIComponent(key1)}`;
    }

    fetch(url + params, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(res => {
      if (!res.ok) return alert('Update failed');
      alert('Saved successfully!');
      btn.textContent = 'Edit';
      fields.forEach(f => f.setAttribute('contenteditable', 'false'));
      loadStaticTable(type);
    }).catch(err => {
      console.error('Update error:', err);
    });
  } else {
    // Enable editing
    fields.forEach(f => f.setAttribute('contenteditable', 'true'));
    btn.textContent = 'Save';
    alert('Editing is enabled. You can now modify the fields.');
  }
}

// Delete Row for all static tables
function deleteRow(type, key1, key2) {
  if (!confirm('Are you sure you want to delete this?')) return;

  let url = `/admin/static/${type}`;
  let params = '';

  if (type === 'wards') {
    params = `?ward=${encodeURIComponent(key1)}&Quarter=${encodeURIComponent(key2)}`;
  } else if (type === 'hontitles') {
    params = `?Htitle=${encodeURIComponent(key1)}&titlerank=${encodeURIComponent(key2)}`;
  } else {
    params = `?value=${encodeURIComponent(key1)}`;
  }

  fetch(url + params, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) return alert('Delete failed');
      alert('Deleted successfully!');
      loadStaticTable(type);
    })
    .catch(err => console.error('Delete error:', err));
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

window.addEventListener('DOMContentLoaded', () => {
  staticTypes.forEach(loadStaticTable);
});

// Submit notice/event
document.getElementById('noticeForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const token = localStorage.getItem('adminToken');
  const adminId = localStorage.getItem('adminId'); // ✅ fetch adminId
  const title = document.getElementById('noticeTitle').value;
  const content = document.getElementById('noticeContent').value;
  const type = document.getElementById('noticeType').value;

  if (!adminId) {
    alert('Admin ID missing. Please log in again.');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({title, content, type }) // ✅ include adminId
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      this.reset();
      loadNotices();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to post notice/event');
  }
});


// Load and display notices/events
async function loadNotices() {
  try {
    const res = await fetch(`${BASE_URL}/admin/notices`);
    const notices = await res.json();
    const list = document.getElementById('noticesList');
    list.innerHTML = notices.map(n => `
      <div class="mb-4 p-4 border rounded shadow">
        <div class="font-bold">${n.title} <span class="text-xs text-gray-500">[${n.type}]</span></div>
        <div class="text-gray-700">${n.content}</div>
        <div class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('noticesList').innerText = 'Failed to load notices/events';
  }
}

// Call loadNotices() when the notices tab is shown
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'notices-section') loadNotices();
  });
});

window.addEventListener('DOMContentLoaded', () => {
  staticTypes.forEach(loadStaticTable);

  // Prevent default form submission and use AJAX for all static tables
  document.getElementById('addHontitleForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addStaticValue('hontitles');
  });
  document.getElementById('addQualificationForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addStaticValue('qualifications');
  });
  document.getElementById('addWardsForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addStaticValue('wards');
  });
  document.getElementById('addTitleForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    addStaticValue('titles');
  });
});