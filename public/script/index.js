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

       

/*const sql =  require("mssql/msnodesqlv8");
const { use } = require("react");
var config ={
  server : "DESKTOP-NIL5C6H\SQL2022",
  database : "[ocdadatabase]",
  driver : "msnodesqlv8",
  user : "sa",
  password : "H1cadServer",
  options : {
    trustedConnection : true
  }
}

sql.connect(config, function(err) {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Database connected successfully');

  const request = new sql.Request();
  request.query('SELECT * FROM [ocdadatabase].[dbo].[news]', function(err, result) {
    if (err) {
      console.error('❌ Query failed:', err);
      return;
    }
    console.log('✅ Query executed successfully');
    console.log(result.recordset);
  });
});*/