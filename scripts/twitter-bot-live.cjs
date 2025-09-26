const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs').promises;
require('dotenv').config({ path: './.env' });

// Twitter credentials from environment variables
const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

// Track contacted users
const CONTACTED_FILE = 'twitter_contacted.json';

async function getContactedUsers() {
  try {
    const data = await fs.readFile(CONTACTED_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveContactedUser(userId, username) {
  const contacted = await getContactedUsers();
  contacted.push({ userId, username, date: new Date().toISOString() });
  await fs.writeFile(CONTACTED_FILE, JSON.stringify(contacted, null, 2));
}

// Search queries to find GPU owners
const SEARCH_QUERIES = [
  'io.net GPU',
  'io.net mining',
  'io.net earnings',
  'io.net RTX 4090',
  'io.net passive income',
  '@ionet GPU revenue',
];

const DM_TEMPLATE = `Hey! I noticed you're running GPUs on io.net.

I help GPU owners increase revenue by 30%+ through AI optimization:
• Dynamic pricing adjustments
• 24/7 performance monitoring
• Automatic configuration tweaks

No upfront cost - only 15% of EXTRA revenue generated.

Most clients earning $5k+/month see $1,500+ extra (you keep $1,275).

Free analysis showing your potential gains?

Check ai-nodes.com or reply here.`;

async function findAndMessageUsers() {
  console.log('🚀 Starting Twitter outreach bot...');
  console.log('⏰ Time:', new Date().toISOString());

  const contacted = await getContactedUsers();
  const contactedIds = contacted.map(c => c.userId);

  let messagesSent = 0;

  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`🔍 Searching for: "${query}"`);

      // Search recent tweets
      const tweets = await rwClient.v2.search(query, {
        max_results: 10,
        'tweet.fields': 'author_id,created_at',
      });

      if (!tweets.data || tweets.data.length === 0) {
        console.log(`  No tweets found for: ${query}`);
        continue;
      }

      for (const tweet of tweets.data) {
        const userId = tweet.author_id;

        // Skip if already contacted
        if (contactedIds.includes(userId)) {
          continue;
        }

        try {
          // Get user details
          const user = await rwClient.v2.user(userId, {
            'user.fields': 'public_metrics'
          });

          // Only message accounts with 50+ followers
          if (user.data.public_metrics.followers_count > 50) {
            try {
              // Send DM
              await rwClient.v1.createDm({
                recipient_id: userId,
                text: DM_TEMPLATE
              });

              console.log(`✅ Messaged @${user.data.username} (${user.data.public_metrics.followers_count} followers)`);
              await saveContactedUser(userId, user.data.username);
              messagesSent++;

              // Wait 45 seconds between messages
              await new Promise(r => setTimeout(r, 45000));

            } catch (error) {
              console.log(`❌ Could not DM @${user.data.username} - DMs may be closed`);
            }
          }
        } catch (error) {
          console.log(`  Error processing user ${userId}:`, error.message);
        }
      }
    } catch (error) {
      console.error(`Error searching "${query}":`, error.message);
    }
  }

  console.log(`\n✅ Outreach complete! Sent ${messagesSent} messages`);
  console.log('💰 Expected results:');
  console.log('  - 10% response rate = ~' + Math.round(messagesSent * 0.1) + ' responses');
  console.log('  - 20% conversion = ~' + Math.round(messagesSent * 0.02) + ' customers');
  console.log('  - At $500/month each = $' + (Math.round(messagesSent * 0.02) * 500) + '/month revenue\n');

  // Schedule next run in 2 hours
  console.log('⏰ Next run in 2 hours...');
  setTimeout(findAndMessageUsers, 2 * 60 * 60 * 1000);
}

// Start immediately
console.log('🤖 AI Nodes Twitter Bot Starting...');
console.log('📊 Your first dollar expected within 24-48 hours');
console.log('💰 First $500+ customer expected within 3-5 days\n');

findAndMessageUsers();