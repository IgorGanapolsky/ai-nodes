#!/usr/bin/env tsx

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function getLinearTeam() {
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY not found in environment variables');
    process.exit(1);
  }

  const query = `
    query Teams {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      process.exit(1);
    }

    console.log('Linear Teams:');
    data.data.teams.nodes.forEach((team: any) => {
      console.log(`  Team: ${team.name}`);
      console.log(`    ID: ${team.id}`);
      console.log(`    Key: ${team.key}`);
      console.log();
    });

    if (data.data.teams.nodes.length > 0) {
      const firstTeamId = data.data.teams.nodes[0].id;
      console.log(`\n💡 Add this to your .env file:`);
      console.log(`LINEAR_TEAM_ID=${firstTeamId}`);
    }

  } catch (error) {
    console.error('Error fetching teams:', error);
    process.exit(1);
  }
}

getLinearTeam();