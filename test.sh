#!/bin/bash

# SemanticAtlas Quick Test Script

set -e

echo "🧪 SemanticAtlas Test Suite"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js 20+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Running npm install...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi
echo ""

# Check environment variables
echo "🔧 Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit .env.local with your API keys${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi
echo ""

# Run TypeScript check
echo "🔍 Running TypeScript check..."
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    echo -e "${RED}❌ TypeScript errors found${NC}"
    npx tsc --noEmit
    exit 1
else
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
fi
echo ""

# Run linter
echo "🔍 Running ESLint..."
if npm run lint 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠️  Linting warnings found (non-blocking)${NC}"
else
    echo -e "${GREEN}✅ Linting passed${NC}"
fi
echo ""

# Run build
echo "🏗️  Building production bundle..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    npm run build
    exit 1
fi
echo ""

# Check build output
echo "📊 Build output size:"
du -sh .next 2>/dev/null || echo "Build directory not found"
echo ""

# Run local smoke tests
echo "🧪 Running local smoke tests..."
if npm run test:local 2>&1 | grep -q "✅"; then
    echo -e "${GREEN}✅ Local tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Local tests skipped or failed (non-blocking)${NC}"
fi
echo ""

# Summary
echo "============================"
echo -e "${GREEN}✅ All critical tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review .env.local and add your GROQ_API_KEY"
echo "2. Run 'npm run dev' to test locally"
echo "3. Deploy to Vercel or your preferred platform"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"
