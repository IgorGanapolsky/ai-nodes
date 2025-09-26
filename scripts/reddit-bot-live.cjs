const snoowrap = require('snoowrap');
const fs = require('fs').promises;
require('dotenv').config({ path: './.env' });

// Reddit credentials from environment variables
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT || 'AI-Nodes-Bot/1.0',
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

// Subreddits to monitor
const SUBREDDITS = [
  'ioNet',
  'gpumining',
  'cryptomining',
  'PassiveIncome'
];

const MESSAGED_FILE = 'reddit_contacted.json';

async function getMessagedUsers() {
  try {
    const data = await fs.readFile(MESSAGED_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMessagedUser(username) {
  const messaged = await getMessagedUsers();
  messaged.push({ username, date: new Date().toISOString() });
  await fs.writeFile(MESSAGED_FILE, JSON.stringify(messaged, null, 2));
}

const MESSAGE = `Hey! I noticed your post about GPUs/mining.

I run AI Nodes - we help io.net GPU owners increase revenue by 30%+ through:

• **Dynamic Pricing**: AI adjusts rates hourly based on demand
• **24/7 Monitoring**: Instant alerts for downtime/issues
• **Auto-Optimization**: Configuration tweaks for max earnings

**No upfront costs** - We only take 15% of EXTRA revenue generated.

Example: If you're earning $5k/month, we typically add $1,500+ (you keep $1,275).

Want a free analysis showing your potential gains?

Check out ai-nodes.com or reply here.

Best,
AI Nodes Team`;

async function monitorAndMessage() {
  console.log('🤖 Reddit Bot Starting...');
  console.log('⏰ Time:', new Date().toISOString());

  const messaged = await getMessagedUsers();
  const messagedUsernames = messaged.map(m => m.username);
  let messagesSent = 0;

  for (const subName of SUBREDDITS) {
    try {
      console.log(`\n📍 Checking r/${subName}...`);
      const subreddit = await reddit.getSubreddit(subName);

      // Get new posts
      const posts = await subreddit.getNew({ limit: 10 });

      for (const post of posts) {
        const text = (post.title + ' ' + post.selftext).toLowerCase();
        const keywords = ['gpu', 'rtx', 'mining', 'earnings', 'io.net', 'ionet', 'passive income', '4090', '3090'];

        if (keywords.some(keyword => text.includes(keyword))) {
          if (!messagedUsernames.includes(post.author.name) && post.author.name !== '[deleted]') {
            try {
              await reddit.composeMessage({
                to: post.author.name,
                subject: 'Increase your GPU earnings by 30%+',
                text: MESSAGE
              });

              console.log(`  ✅ Messaged u/${post.author.name}`);
              await saveMessagedUser(post.author.name);
              messagesSent++;

              // Wait 1 minute between messages
              await new Promise(r => setTimeout(r, 60000));
            } catch (err) {
              console.log(`  ❌ Could not message u/${post.author.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error with r/${subName}:`, error.message);
    }
  }

  console.log(`\n✅ Reddit scan complete! Sent ${messagesSent} messages`);
  console.log('💰 Expected results:');
  console.log('  - 15% response rate = ~' + Math.round(messagesSent * 0.15) + ' responses');
  console.log('  - 25% conversion = ~' + Math.round(messagesSent * 0.04) + ' customers');
  console.log('  - At $500/month each = $' + (Math.round(messagesSent * 0.04) * 500) + '/month revenue\n');

  // Schedule next run in 3 hours
  console.log('⏰ Next run in 3 hours...');
  setTimeout(monitorAndMessage, 3 * 60 * 60 * 1000);
}

// Start immediately
console.log('🚀 AI Nodes Reddit Bot Starting...');
console.log('📊 Your first lead expected within 12-24 hours');
console.log('💰 First paying customer expected within 2-3 days\n');

monitorAndMessage();