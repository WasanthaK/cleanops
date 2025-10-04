#!/bin/bash
# Phase 1 Setup Script
# This script automates the setup of Phase 1 integrations

set -e  # Exit on error

echo "=================================="
echo "CleanOps Phase 1 Setup"
echo "=================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the repository root"
    exit 1
fi

echo "Step 1: Checking dependencies..."
echo "--------------------------------"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm not found, installing..."
    npm install -g pnpm
    print_success "pnpm installed"
else
    print_success "pnpm is installed"
fi

# Check if Docker is running (for PostgreSQL)
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
else
    print_success "Docker is running"
fi

echo ""
echo "Step 2: Installing dependencies..."
echo "--------------------------------"

pnpm install
print_success "Dependencies installed"

echo ""
echo "Step 3: Checking environment configuration..."
echo "--------------------------------"

if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
        print_warning "Please update .env with your Xero and Evia Sign credentials"
        print_info "Run: nano .env"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file exists"
fi

# Check for required environment variables
if grep -q "your_xero_client_id" .env; then
    print_warning "Xero credentials not configured in .env"
    print_info "Update XERO_CLIENT_ID and XERO_CLIENT_SECRET in .env"
fi

if grep -q "your-32-character-encryption-key" .env; then
    print_warning "Encryption key not configured in .env"
    print_info "Generate one with: node -e \"console.log(require('crypto').randomBytes(16).toString('hex'))\""
fi

echo ""
echo "Step 4: Starting Docker services..."
echo "--------------------------------"

docker-compose up -d postgres minio

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is accepting connections
until docker-compose exec -T postgres pg_isready -U cleanops &> /dev/null; do
    print_info "Waiting for PostgreSQL..."
    sleep 2
done
print_success "PostgreSQL is ready"

echo ""
echo "Step 5: Running database migrations..."
echo "--------------------------------"

cd infra/prisma

# Check if Prisma binaries are available
if npx prisma --version &> /dev/null; then
    print_success "Prisma CLI is available"
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"
    
    # Run migrations
    print_info "Running migrations..."
    npx prisma migrate deploy
    print_success "Migrations completed"
else
    print_warning "Prisma CLI not available, using manual migration"
    
    # Use manual migration
    if [ -f "migrations/add_phase1_integrations.sql" ]; then
        print_info "Running manual migration..."
        docker-compose exec -T postgres psql -U cleanops -d cleanops < migrations/add_phase1_integrations.sql
        print_success "Manual migration completed"
    else
        print_error "Manual migration file not found"
        exit 1
    fi
fi

cd ../..

echo ""
echo "Step 6: Seeding database..."
echo "--------------------------------"

cd packages/api

# Check if seed script exists
if [ -f "src/prisma/seed.ts" ]; then
    print_info "Running seed script..."
    pnpm seed
    print_success "Database seeded"
else
    print_warning "Seed script not found, skipping..."
fi

cd ../..

echo ""
echo "=================================="
echo "Phase 1 Setup Complete! 🚀"
echo "=================================="
echo ""

print_info "Next steps:"
echo ""
echo "1. Configure Xero credentials in .env:"
echo "   - XERO_CLIENT_ID"
echo "   - XERO_CLIENT_SECRET"
echo "   - ENCRYPTION_KEY"
echo ""
echo "2. (Optional) Configure Evia Sign credentials in .env:"
echo "   - EVIA_SIGN_API_KEY"
echo "   - EVIA_SIGN_API_URL"
echo "   - EVIA_SIGN_WEBHOOK_SECRET"
echo ""
echo "3. Start the API server:"
echo "   cd packages/api && pnpm dev"
echo ""
echo "4. Seed pre-built templates:"
echo "   curl -X POST http://localhost:3000/templates/seed \\"
echo "     -H \"Authorization: Bearer YOUR_JWT_TOKEN\""
echo ""
echo "5. Test the integrations:"
echo "   - Xero: http://localhost:3000/integrations/xero/connect"
echo "   - Templates: http://localhost:3000/templates"
echo "   - Evia Sign: http://localhost:3000/integrations/evia-sign/send"
echo ""
echo "Documentation:"
echo "   - DEPLOYMENT_CHECKLIST.md - Step-by-step deployment guide"
echo "   - INTEGRATION_GUIDE.md - Technical documentation"
echo "   - API_EXAMPLES.md - API usage examples"
echo ""

print_success "Setup script completed successfully!"
