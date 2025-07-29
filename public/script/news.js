document.addEventListener('DOMContentLoaded', () => {
  const newsList = document.getElementById('newsList');
  const toggleBtn = document.getElementById('toggleNewsView');
  const pagination = document.getElementById('newsPagination');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageIndicator = document.getElementById('newsPageIndicator');
  const yearFilter = document.getElementById('newsYearFilter');

  let showAll = false;
  let currentPage = 1;
  const perPage = 5;
  let totalPages = 1;
  let currentYear = "";

  // Fetch and render years in dropdown
  async function loadYears() {
    try {
      const res = await fetch('/admin/notices?limit=all');
      const data = await res.json();
      const years = [...new Set(data.map(item => new Date(item.created_at).getFullYear()))];
      years.sort((a, b) => b - a);
      years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearFilter.appendChild(opt);
      });
    } catch (err) {
      console.error("Failed to load year options:", err);
    }
  }

  async function fetchNews() {
    const url = new URL('/admin/notices', window.location.origin);
    if (currentYear) url.searchParams.set('year', currentYear);

    if (!showAll) {
      url.searchParams.set('page', currentPage);
      url.searchParams.set('perPage', perPage);
    } else {
      url.searchParams.set('limit', 100); // prevent overload
    }

    const res = await fetch(url);
    return res.json();
  }

  async function renderNews() {
    const data = await fetchNews();
    newsList.innerHTML = '';

    if (!data.length) {
      newsList.innerHTML = '<li>No news or events found.</li>';
      pagination.classList.add('hidden');
      return;
    }

    data.forEach(item => {
      const li = document.createElement('li');
      const date = new Date(item.created_at).toLocaleDateString();
      li.classList.add('border', 'rounded', 'p-3', 'bg-white', 'shadow');

      li.innerHTML = `
        <div class="flex justify-between items-center cursor-pointer news-header">
          <span class="font-semibold">${item.title}</span>
          <span class="text-xs text-gray-400">${date}</span>
        </div>
        <div class="news-content mt-2 text-sm text-gray-700 hidden">${item.content}</div>
      `;
      li.querySelector('.news-header').addEventListener('click', () => {
        li.querySelector('.news-content').classList.toggle('hidden');
      });
      newsList.appendChild(li);
    });

    // Handle pagination UI
    if (showAll || data.length <= perPage) {
      pagination.classList.add('hidden');
    } else {
      pagination.classList.remove('hidden');
      pageIndicator.textContent = `Page ${currentPage}`;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = data.length < perPage;
    }
  }

  // Event Listeners
  toggleBtn.addEventListener('click', () => {
    showAll = !showAll;
    currentPage = 1;
    toggleBtn.textContent = showAll ? 'Show Latest 5' : 'Show All';
    renderNews();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderNews();
    }
  });

  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderNews();
  });

  yearFilter.addEventListener('change', () => {
    currentYear = yearFilter.value;
    currentPage = 1;
    renderNews();
  });

  // Init
  loadYears();
  renderNews();
});