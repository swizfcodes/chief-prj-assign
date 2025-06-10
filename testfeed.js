const Parser = require('rss-parser');
const parser = new Parser();

(async () => {
  try {
    const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
    console.log('Feed Title:', feed.title);
    console.log('First Item:', feed.items[0].title);
  } catch (err) {
    console.error('❌ Failed to fetch feed:', err.message);
  }
})();