# Testing & Deployment Guide

## Prerequisites

- Node.js 20+
- npm
- Browser wallet (MetaMask, Rabby, etc.) with Arkiv Braga testnet configured
- Braga testnet GLM tokens for transactions

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Required for production
NEXT_PUBLIC_ARKIV_RPC_URL=https://braga.hoodi.arkiv.network/rpc
NEXT_PUBLIC_ARKIV_EXPLORER_URL=https://explorer.braga.hoodi.arkiv.network
NEXT_PUBLIC_ARKIV_EXPIRES_IN_SECONDS=2592000

# Required for AI insights (get from https://console.groq.com)
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY
GROQ_MODEL=llama-3.1-8b-instant

# Optional: Only needed for CLI testing
# ARKIV_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

## 3. Local Testing

### Build Check
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### Test Checklist

- [ ] Homepage loads
- [ ] Navigate to `/create`
- [ ] Connect wallet (should prompt for Braga network)
- [ ] Create a memory with encryption
- [ ] View memory at `/memory/[key]`
- [ ] Generate an AI insight
- [ ] Navigate to `/query`
- [ ] Search by domain/modifier
- [ ] Decrypt encrypted content

### Run Local Smoke Tests (Optional)
```bash
npm run test:local
```

### Run Braga Integration Test (Optional)
Requires `ARKIV_PRIVATE_KEY` in `.env.local`:
```bash
npm run test:braga
```

## 4. Deployment Options

### Option A: Vercel (Recommended)

**1. Push to GitHub:**
```bash
git init
git add .
git commit -m "SemanticAtlas v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/semantic-atlas.git
git push -u origin main
```

**2. Deploy to Vercel:**
- Go to https://vercel.com
- Click "New Project"
- Import your GitHub repository
- Configure environment variables:
  - `NEXT_PUBLIC_ARKIV_RPC_URL`
  - `NEXT_PUBLIC_ARKIV_EXPLORER_URL`
  - `NEXT_PUBLIC_ARKIV_EXPIRES_IN_SECONDS`
  - `GROQ_API_KEY`
  - `GROQ_MODEL`
- Click "Deploy"

**3. Custom Domain (Optional):**
- Go to Project Settings → Domains
- Add your custom domain

### Option B: Docker

**1. Create Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

**2. Build and run:**
```bash
docker build -t semantic-atlas .
docker run -p 3000:3000 --env-file .env.local semantic-atlas
```

### Option C: Traditional VPS (Ubuntu)

**1. Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Clone and build:**
```bash
git clone https://github.com/YOUR_USERNAME/semantic-atlas.git
cd semantic-atlas
npm install
npm run build
```

**3. Run with PM2:**
```bash
sudo npm install -g pm2
pm2 start npm --name "semantic-atlas" -- start
pm2 save
pm2 startup
```

**4. Configure Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 5. Post-Deployment Verification

### Test Production Deployment:

1. **Connect Wallet**
   - Visit your deployed URL
   - Click "Connect Wallet"
   - Approve Braga network switch

2. **Create Memory**
   - Go to `/create`
   - Fill in memory details
   - Select encryption mode
   - Submit transaction
   - Verify on Braga explorer

3. **View Memory**
   - Navigate to `/memory/[key]`
   - Verify memory displays correctly
   - Test decryption if encrypted

4. **Generate Insight**
   - On memory page, generate AI insight
   - Verify Groq API integration works
   - Submit insight to Arkiv

5. **Query Memories**
   - Go to `/query`
   - Search by domain, modifier, or owner
   - Verify results display

## 6. Monitoring

### Check Logs (Vercel):
```bash
vercel logs
```

### Check Logs (PM2):
```bash
pm2 logs semantic-atlas
```

### Monitor Arkiv Transactions:
- Visit https://explorer.braga.hoodi.arkiv.network
- Search for your wallet address
- Verify entity creations

## 7. Troubleshooting

### Build Fails:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Wallet Won't Connect:
- Ensure Braga network is added to wallet
- Chain ID: 60138453102
- RPC: https://braga.hoodi.arkiv.network/rpc

### Groq API Errors:
- Verify `GROQ_API_KEY` is set correctly
- Check API quota at https://console.groq.com
- Ensure key is not exposed as `NEXT_PUBLIC_*`

### Transaction Fails:
- Ensure wallet has GLM tokens
- Check gas settings in constants.ts
- Verify RPC URL is accessible

## 8. Update Deployment

### Vercel:
```bash
git add .
git commit -m "Update"
git push
# Auto-deploys
```

### VPS:
```bash
git pull
npm install
npm run build
pm2 restart semantic-atlas
```

## 9. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ARKIV_RPC_URL` | Yes | Braga RPC endpoint |
| `NEXT_PUBLIC_ARKIV_EXPLORER_URL` | Yes | Braga explorer URL |
| `NEXT_PUBLIC_ARKIV_EXPIRES_IN_SECONDS` | Yes | Entity TTL (default: 2592000) |
| `GROQ_API_KEY` | Yes | Groq API key for AI insights |
| `GROQ_MODEL` | Yes | Groq model name |
| `ARKIV_PRIVATE_KEY` | No | Only for CLI testing |

## 10. Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Never expose `GROQ_API_KEY` as `NEXT_PUBLIC_*`
- [ ] Never commit private keys
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Review CORS settings if needed

---

**Your SemanticAtlas is ready to deploy!** 🚀
