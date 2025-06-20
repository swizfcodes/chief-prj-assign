    const hamburger = document.getElementById('hamburger');
    const navbar = document.getElementById('navbar');

    hamburger.addEventListener('click', () => {
      navbar.classList.toggle('active');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Remove class when out of view to retrigger
        } else {
          entry.target.classList.remove('visible');
          }
      });
    }, {
      threshold: 0.1
    });

  document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));


  /*window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('news');

  try {
    const response = await fetch('/news');
    const articles = await response.json();

    if (!Array.isArray(articles)) {
      throw new Error('Expected an array of articles, got: ' + JSON.stringify(articles));
    }

    articles.forEach(article => {
      const card = document.createElement('div');
      card.className = 'news-card';

      card.innerHTML = `
        ${article.image ? `<img src="${article.image}" alt="News Thumbnail" />` : ''}
        <div class="news-content">
          <h2>${article.title}</h2>
          <p>${new Date(article.pubDate).toLocaleString()}</p>
          <a href="${article.link}" target="_blank">Read More</a>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load news:', error);
    container.innerHTML = `<p>Could not load news at this time.</p>`;
  }
});*/

       

