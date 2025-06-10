const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');

const app = express();
const port = 5500;

// Add user-agent to avoid being blocked
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Node.js RSS Reader)',
  },
});

app.use(cors());
app.use(express.static('public'));

app.get('/news', async (req, res) => {
  try {
    const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
    const articles = feed.items.map(item => {
      const media = item['media:content'] || item['media:thumbnail'];
      const imageUrl = media && media.$ && media.$.url ? media.$.url : null;

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        image: imageUrl
      };
    });

    res.json(articles);
  } catch (err) {
    console.error('❌ Failed to fetch news:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
