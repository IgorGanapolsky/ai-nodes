# 🚀 START HERE - Make Money with DePIN Autopilot

## THE ONLY COMMAND YOU NEED TO RUN:

```bash
./setup-and-deploy.sh
```

That's it. This script will:
1. ✅ Install everything needed
2. ✅ Ask you for credentials (creates them if you don't have any)
3. ✅ Set up the database
4. ✅ Start your money-making platform
5. ✅ Give you a dashboard to manage everything

## What You'll Be Asked:

1. **Admin credentials** - Make up a username/password for YOUR dashboard
2. **Stripe account** - Sign up free at stripe.com (or skip for now)
3. **io.net credentials** - Your io.net login (or skip to use fake data)

## After Setup, You'll Get:

- **Dashboard**: http://localhost:3000 (login with your admin credentials)
- **API**: http://localhost:4000
- **Commands**:
  - `./add-client.sh` - Add a paying client
  - `./generate-invoice.sh` - Bill your clients
  - `./start-services.sh` - Restart everything

## To Get Your First Client:

1. Post in io.net Discord: "Free device optimization audit - DM me"
2. When someone DMs you, run: `./add-client.sh`
3. Enter their info, add their device
4. Let it run for a week
5. Generate invoice: `./generate-invoice.sh`
6. Get paid via Stripe link

## Troubleshooting:

**"Command not found"**
```bash
chmod +x setup-and-deploy.sh
./setup-and-deploy.sh
```

**"Port already in use"**
```bash
lsof -ti:4000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
./start-services.sh
```

**"Need io.net credentials"**
1. Sign up at https://cloud.io.net
2. Re-run: `./setup-and-deploy.sh`
3. Choose option 2 (email/password)

## That's It!

You now have a business. Go find clients.