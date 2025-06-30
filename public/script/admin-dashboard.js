
    // Create Admin
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
        const res = await fetch('http://localhost:5500/admin/create', {
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
      } catch (err) {
        console.error('Create Admin Error:', err);
        alert('Server error');
      }
    });

    // Load Admin List
    async function loadAdmins() {
      const token = localStorage.getItem('adminToken');
      if (!token) return document.getElementById('adminTable').innerText = 'Unauthorized – No token found.';

      try {
        const res = await fetch('http://localhost:5500/admin/list', {
          headers: { 'Authorization': token }
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
                <th class="p-2 border">Username</th>
                <th class="p-2 border">Email</th>
                <th class="p-2 border">Role</th>
              </tr>
            </thead>
            <tbody>
              ${admins.map((admin, index) => `
                <tr>
                  <td class="p-2 border">${index + 1}</td>
                  <td class="p-2 border">${admin.fullname}</td>
                  <td class="p-2 border">${admin.email}</td>
                  <td class="p-2 border">${admin.role}</td>
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

      // Format amount with ₦ and commas
    const formatAmount = amount => `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    // Format date to DD/MM/YYYY
    const formatDate = dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date)) return dateStr;
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Tab navigation
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active-tab'));
        tab.classList.add('active-tab');
        contents.forEach(c => c.classList.add('hidden'));
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
      });
    });

    // Fetch Data Sections
 function fetchTable(endpoint, targetId, renderFn) {
  fetch(endpoint, {
    headers: {
      'Authorization': localStorage.getItem('adminToken') || ''
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

  // Fetch and render Member Ledger
  fetchTable('/admin/memberledger', 'ledgerData', row => `
    <tr class="border-t">
      <td class="p-2">${row.phoneno}</td>
      <td class="p-2">${formatDate(row.transdate)}</td>
      <td class="p-2">${formatAmount(row.amount)}</td>
      <td class="p-2">${row.remark}</td>
    </tr>
  `);

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
      <td class="p-2">${row.expscode}</td>
      <td class="p-2">${row.expsdesc}</td>
    </tr>
  `);

    // Logout
    function adminLogout() {
      localStorage.removeItem('adminToken');
      window.location.href = '/adminlog.html';
    }

    // Init
    window.addEventListener('DOMContentLoaded', loadAdmins);

    // 🟢 Create New Member (Screen G)
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
        'Authorization': localStorage.getItem('adminToken') || ''
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(res.ok ? 'Member created successfully!' : (result.message || 'Error creating member.'));
    if (res.ok) form.reset();
  } catch (err) {
    console.error('Create Member Error:', err);
    alert('Server error');
  }
});

//show the member list
let allMembers = [];
let currentPage = 1;
const rowsPerPage = 10;

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
    <td class="p-3">${m.State}</td>
    <td class="p-3">${m.Town}</td>
    <td class="p-3">${m.DOB?.split('T')[0] || ''}</td>
    <td class="p-3">${m.Profession}</td>
    <td class="p-3">${m.Qualifications}</td>
    <td class="p-3">${m.email}</td>
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
    const token = localStorage.getItem('adminToken');
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
let originalPhone = ''; // global

async function viewMember(phone) {
  originalPhone = phone;

  try {
    const res = await fetch(`/admin/member/${phone}`, {
      headers: {
        'Authorization': localStorage.getItem('adminToken')
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch member');
    }

    const member = await res.json();
    const form = document.getElementById('memberEditForm');

    for (const key in member) {
      if (form.elements[key]) {
        form.elements[key].value = member[key];
      }
    }

    document.getElementById('memberDetails').classList.remove('hidden');
    window.scrollTo({
      top: document.getElementById('memberDetails').offsetTop,
      behavior: 'smooth'
    });

  } catch (err) {
    console.error('View member error:', err);
    alert('Could not load member details.');
  }
}

function closeMemberDetails() {
  document.getElementById('memberDetails').classList.add('hidden');
}

// Save changes
async function saveMemberChanges() {
  const form = document.getElementById('memberEditForm');
  const data = Object.fromEntries(new FormData(form));
  const newPhone = data.PhoneNumber.trim();

  // 🔒 Confirm if main phone number was changed
  if (newPhone !== originalPhone) {
    const confirmChange = confirm(
      `You changed the primary phone number from ${originalPhone} to ${newPhone}. This may affect member identity.\n\nDo you want to proceed?`
    );
    if (!confirmChange) return;
  }

  // 🔎 Check if new phone number already exists
  try {
    const checkRes = await fetch(`/admin/member/${newPhone}`, {
      headers: { 'Authorization': localStorage.getItem('adminToken') }
    });

    // If exists and is NOT the same member, stop
    if (checkRes.ok && newPhone !== originalPhone) {
      alert(`A member already exists with phone number: ${newPhone}`);
      return;
    }
  } catch (err) {
    console.warn('Phone check skipped (probably not found, that’s okay).');
  }

  // 🔄 Proceed with update
  try {
    const res = await fetch(`/admin/member/${originalPhone}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('adminToken')
      },
      body: JSON.stringify(data)
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




// 🟢 Add Payment to Member Ledger (Screen D)
document.getElementById('ledgerForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    phoneno: form.phoneno.value,
    transdate: form.transdate.value,
    amount: parseFloat(form.amount.value),
    remark: form.remark.value
  };

  console.log('Submitting ledger entry for:', data);


  try {
    const res = await fetch(`/admin/ledger-entry/${data.phoneno}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('adminToken') || ''
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(res.ok ? 'Ledger entry recorded!' : (result.message || 'Error submitting ledger entry.'));
    if (res.ok) form.reset();
  } catch (err) {
    console.error('Ledger Error:', err.message || err);
    alert('Server error');
  }
});


// 🟢 Add OCDA Expense (Screen E)
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
        'Authorization': localStorage.getItem('adminToken') || ''
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

/*async function loadProjectDropdown() {
  try {
    const res = await fetch('/api/project-list');
    const projects = await res.json();
    const dropdown = document.getElementById('projectDropdown');
    dropdown.innerHTML = projects.map(p => `<option value="${p}">${p}</option>`).join('');
  } catch (err) {
    console.error('Project List Load Error:', err);
  }
}*/


//render ocda update
async function loadOCDAExpenses() {
  try {
    const res = await fetch('/admin/ocdaexpenses', {
      headers: {
        'Authorization': localStorage.getItem('adminToken') || ''
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



// 🟢 Monthly Summary Update (Screen F)
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
        'Authorization': localStorage.getItem('adminToken') || ''
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
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/admin/enquiry/options', {
      headers: { 'Authorization': token }
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

// 📤 Submit Enquiry
document.getElementById('enquiryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const type = form.enquiryType.value;
  const mode = form.detail.checked ? 'detail' : 'summary';
  const start = form.start.value;
  const end = form.end.value;

  // 🔁 Grab the right param based on visible group
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
      headers: { 'Authorization': localStorage.getItem('adminToken') || '' }
    });
    const result = await res.json();

    if (!res.ok) return alert(result.message || 'Enquiry failed.');

    renderEnquiryResults(result); // render both summary & detail
  } catch (err) {
    console.error('Enquiry Error:', err);
    alert('Server error');
  }
});


// 📄 Render Results like Screen H
function renderEnquiryResults(data) {
  const wrapper = document.getElementById('enquiryTableWrapper');
  const container = document.getElementById('enquiryResults');
  container.classList.remove('hidden');

  const summary = data?.summary || [];
  const detail = data?.detail || [];

  // If both are empty
  if (summary.length === 0 && detail.length === 0) {
    wrapper.innerHTML = '<p class="text-gray-500 italic">No results found.</p>';
    document.getElementById('enquiryTableExport').innerHTML = '';
    return;
  }

  // Table generator
  const generateTable = (title, rows) => {
    if (!rows.length) {
      return `<div class="w-full"><h3 class="font-bold mb-2">${title}</h3><p>No data.</p></div>`;
    }

    const headers = Object.keys(rows[0]);
    const headerRow = headers.map(h => `<th class="p-2 border">${h}</th>`).join('');
    const dataRows = rows.map(row =>
      `<tr>${headers.map(h => `<td class="p-2 border">${row[h] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    return `
      <div class="w-full md:w-1/2 pr-2 mb-4">
        <h3 class="font-bold mb-2">${title}</h3>
        <div class="overflow-auto border rounded">
          <table class="min-w-full text-sm text-left border border-collapse">
            <thead class="bg-gray-200"><tr>${headerRow}</tr></thead>
            <tbody>${dataRows}</tbody>
          </table>
        </div>
      </div>
    `;
  };

  // Render to visible wrapper
  wrapper.innerHTML = `
    <div class="flex flex-col md:flex-row md:space-x-4">
      ${generateTable('Summary', summary)}
      ${generateTable('Details', detail)}
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


// 📤 Export
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

// 🖨 Print
function printEnquiry() {
  const content = document.getElementById('enquiryTableWrapper').innerHTML;
  const win = window.open('', '', 'width=900,height=700');
  win.document.write('<html><head><title>Print Enquiry</title></head><body>');
  win.document.write(content);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}

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
    </tr>
  `);
}


  