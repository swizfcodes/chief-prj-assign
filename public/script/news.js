document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/admin/notices');
    const newsItems = await res.json();
    const newsList = document.getElementById('newsList');
    
    newsList.innerHTML = '';

    if (!Array.isArray(newsItems) || newsItems.length === 0) {
      newsList.innerHTML = `<li class="text-gray-500">No news or events available at this time.</li>`;
      return;
    }

    newsItems.forEach((item, index) => {
      const li = document.createElement('li');
      const date = new Date(item.created_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      li.innerHTML = `
        <div class="border rounded shadow">
          <button class="w-full text-left px-4 py-2 bg-gray-100 font-medium hover:bg-gray-200 transition" data-toggle="news-${index}">
            ${item.title}
            <span class="text-xs text-gray-400 float-right">(${date})</span>
          </button>
          <div id="news-${index}" class="px-4 py-3 hidden bg-white text-sm text-gray-700 border-t">
            ${item.content || '<i>No content provided</i>'}
          </div>
        </div>
      `;
      newsList.appendChild(li);
    });

    // Attach event listeners to toggle buttons
    document.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-toggle');
        const contentDiv = document.getElementById(targetId);
        contentDiv.classList.toggle('hidden');
      });
    });
  } catch (err) {
    console.error('Failed to load news:', err);
    document.getElementById('newsList').innerHTML = '<li class="text-red-500">Error loading news.</li>';
  }
});
