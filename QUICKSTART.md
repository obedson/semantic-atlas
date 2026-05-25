# Quick Start Guide

## Test Locally (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and add your GROQ_API_KEY

# 3. Run tests
./test.sh

# 4. Start dev server
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (2 minutes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# Follow prompts and add environment variables when asked
```

## Deploy to Vercel via GitHub (3 minutes)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/semantic-atlas.git
git push -u origin main

# 2. Go to https://vercel.com
# 3. Click "New Project"
# 4. Import your repository
# 5. Add environment variables:
#    - NEXT_PUBLIC_ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
#    - NEXT_PUBLIC_ARKIV_EXPLORER_URL=https://explorer.braga.hoodi.arkiv.network
#    - NEXT_PUBLIC_ARKIV_EXPIRES_IN_SECONDS=2592000
#    - GROQ_API_KEY=your_groq_key
#    - GROQ_MODEL=llama-3.1-8b-instant
# 6. Click "Deploy"
```

## Test Production Deployment

1. Visit your deployed URL
2. Connect wallet (MetaMask, Rabby, etc.)
3. Switch to Arkiv Braga network when prompted
4. Create a test memory at `/create`
5. View it at `/memory/[key]`
6. Generate an AI insight
7. Query memories at `/query`

## Get Braga Testnet Tokens

If you need GLM tokens for testing:
- Visit Arkiv Discord or community channels
- Request testnet tokens for your wallet address

## Troubleshooting

**Build fails?**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Wallet won't connect?**
- Add Braga network to your wallet:
  - Chain ID: 60138453102
  - RPC: https://braga.hoodi.arkiv.network/rpc
  - Currency: GLM

**Need help?**
- Check DEPLOYMENT.md for detailed guide
- Review error logs in browser console
- Verify environment variables are set

---

**You're ready to go!** 🚀
