#!/bin/bash

# Test Deployment Script for Roo Code Memory Bank MCP Server
# This script validates that the deployment setup is working correctly

set -e  # Exit on any error

echo "🚀 Testing Roo MCP Server Deployment Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check Node.js version
echo -e "\n📋 Checking Prerequisites..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
    
    # Check if version is 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_status "Node.js version is compatible (18+)"
    else
        print_warning "Node.js version $NODE_VERSION may not be compatible. Recommended: 18+"
    fi
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check NPM
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status "NPM found: $NPM_VERSION"
else
    print_error "NPM not found. Please install NPM"
    exit 1
fi

# Check Git
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    print_status "Git found: $GIT_VERSION"
else
    print_error "Git not found. Please install Git"
    exit 1
fi

# Test build process
echo -e "\n🔨 Testing Build Process..."
if [ -f "package.json" ]; then
    print_status "package.json found"
    
    # Install dependencies
    echo "Installing dependencies..."
    if npm install; then
        print_status "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Build project
    echo "Building project..."
    if npm run build; then
        print_status "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
    
    # Check dist directory
    if [ -d "dist" ]; then
        print_status "dist/ directory created"
        
        # Check main file exists
        if [ -f "dist/index.js" ]; then
            print_status "dist/index.js exists"
            
            # Check if file is executable
            if [ -x "dist/index.js" ]; then
                print_status "dist/index.js is executable"
            else
                print_warning "dist/index.js is not executable (may need chmod +x)"
            fi
        else
            print_error "dist/index.js not found"
            exit 1
        fi
    else
        print_error "dist/ directory not created"
        exit 1
    fi
else
    print_error "package.json not found. Are you in the project directory?"
    exit 1
fi

# Test package creation
echo -e "\n📦 Testing Package Creation..."
if npm pack --dry-run > /dev/null 2>&1; then
    print_status "Package can be created successfully"
else
    print_error "Package creation failed"
    exit 1
fi

# Check GitHub workflow files
echo -e "\n⚙️  Checking GitHub Workflows..."
if [ -d ".github/workflows" ]; then
    print_status ".github/workflows directory exists"
    
    if [ -f ".github/workflows/ci.yml" ]; then
        print_status "CI workflow found"
    else
        print_warning "CI workflow not found"
    fi
    
    if [ -f ".github/workflows/release.yml" ]; then
        print_status "Release workflow found"
    else
        print_warning "Release workflow not found"
    fi
else
    print_warning ".github/workflows directory not found"
fi

# Check documentation files
echo -e "\n📚 Checking Documentation..."
DOCS=("README.md" "CHANGELOG.md" "docs/deployment-guide.md" "docs/release-workflow.md" "docs/quick-setup.md")

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        print_status "$doc exists"
    else
        print_warning "$doc not found"
    fi
done

# Test MCP server startup (if not in CI)
if [ "$CI" != "true" ]; then
    echo -e "\n🖥️  Testing MCP Server Startup..."
    echo "Starting server for 3 seconds to test..."
    
    # Start server in background and capture PID
    timeout 3s npm start > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 1
    
    # Check if process is still running
    if kill -0 $SERVER_PID 2>/dev/null; then
        print_status "MCP server started successfully"
        
        # Kill the server
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    else
        print_error "MCP server failed to start"
        exit 1
    fi
else
    print_warning "Skipping server startup test in CI environment"
fi

# Check package.json configuration
echo -e "\n📋 Validating Package Configuration..."
if command -v jq >/dev/null 2>&1; then
    # Check required fields
    NAME=$(jq -r '.name' package.json)
    VERSION=$(jq -r '.version' package.json)
    MAIN=$(jq -r '.main' package.json)
    BIN=$(jq -r '.bin["roo-mcp-server"]' package.json)
    
    print_status "Package name: $NAME"
    print_status "Version: $VERSION"
    print_status "Main entry: $MAIN"
    print_status "Binary: $BIN"
    
    # Check if main file exists
    if [ -f "$MAIN" ]; then
        print_status "Main entry file exists"
    else
        print_warning "Main entry file not found (will be created by build)"
    fi
else
    print_warning "jq not found. Install jq for detailed package validation"
fi

echo -e "\n✨ Deployment Test Summary"
echo "=========================="
print_status "All core tests passed!"
echo -e "\n📝 Next Steps:"
echo "1. Configure NPM_TOKEN in GitHub repository secrets"
echo "2. Push your first tag: git tag v0.1.0 && git push origin v0.1.0"
echo "3. Monitor GitHub Actions for automated deployment"
echo "4. Verify NPM package publication"
echo -e "\n📖 See docs/deployment-guide.md for detailed setup instructions"

echo -e "\n🎉 Ready for automated deployment!"