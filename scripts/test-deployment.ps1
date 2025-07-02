# Test Deployment Script for Roo Code Memory Bank MCP Server (PowerShell)
# This script validates that the deployment setup is working correctly on Windows

param(
    [switch]$SkipServerTest = $false
)

# Set strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

Write-Host "Testing Roo MCP Server Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Functions for colored output
function Write-Success {
    param([string]$Message)
    Write-Host "Success: $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "Warning: $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "Error: $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check Node.js version
Write-Host ""
Write-Host "Checking Prerequisites..." -ForegroundColor Blue

if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
    
    # Check if version is 18+
    $majorVersion = [int]($nodeVersion -replace 'v(\d+).*', '$1')
    if ($majorVersion -ge 18) {
        Write-Success "Node.js version is compatible (18 or higher)"
    } else {
        Write-Warning "Node.js version $nodeVersion may not be compatible. Recommended: 18+"
    }
} else {
    Write-Error "Node.js not found. Please install Node.js 18+"
    exit 1
}

# Check NPM
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Success "NPM found: $npmVersion"
} else {
    Write-Error "NPM not found. Please install NPM"
    exit 1
}

# Check Git
if (Test-Command "git") {
    $gitVersion = git --version
    Write-Success "Git found: $gitVersion"
} else {
    Write-Error "Git not found. Please install Git"
    exit 1
}

# Test build process
Write-Host ""
Write-Host "Testing Build Process..." -ForegroundColor Blue

if (Test-Path "package.json") {
    Write-Success "package.json found"
    
    # Install dependencies
    Write-Host "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies with exit code: $LASTEXITCODE"
        exit 1
    }
    
    # Build project
    Write-Host "Building project..."
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build completed successfully"
    } else {
        Write-Error "Build failed with exit code: $LASTEXITCODE"
        exit 1
    }
    
    # Check dist directory
    if (Test-Path "dist") {
        Write-Success "dist/ directory created"
        
        # Check main file exists
        if (Test-Path "dist/index.js") {
            Write-Success "dist/index.js exists"
        } else {
            Write-Error "dist/index.js not found"
            exit 1
        }
    } else {
        Write-Error "dist/ directory not created"
        exit 1
    }
} else {
    Write-Error "package.json not found. Are you in the project directory?"
    exit 1
}

# Test package creation
Write-Host ""
Write-Host "Testing Package Creation..." -ForegroundColor Blue
$output = npm pack --dry-run 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Package can be created successfully"
} else {
    Write-Error "Package creation failed with exit code: $LASTEXITCODE"
    exit 1
}

# Check GitHub workflow files
Write-Host ""
Write-Host "Checking GitHub Workflows..." -ForegroundColor Blue

if (Test-Path ".github/workflows") {
    Write-Success ".github/workflows directory exists"
    
    if (Test-Path ".github/workflows/ci.yml") {
        Write-Success "CI workflow found"
    } else {
        Write-Warning "CI workflow not found"
    }
    
    if (Test-Path ".github/workflows/release.yml") {
        Write-Success "Release workflow found"
    } else {
        Write-Warning "Release workflow not found"
    }
} else {
    Write-Warning ".github/workflows directory not found"
}

# Check documentation files
Write-Host ""
Write-Host "Checking Documentation..." -ForegroundColor Blue

$docs = @(
    "README.md",
    "CHANGELOG.md", 
    "docs/deployment-guide.md",
    "docs/release-workflow.md",
    "docs/quick-setup.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Success "$doc exists"
    } else {
        Write-Warning "$doc not found"
    }
}

# Test MCP server startup (if not skipped)
if (-not $SkipServerTest -and $env:CI -ne "true") {
    Write-Host ""
    Write-Host "Testing MCP Server Startup..." -ForegroundColor Blue
    Write-Host "Starting server for 3 seconds to test..."
    
    try {
        # Start server process
        $serverProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
        
        # Wait a moment for server to start
        Start-Sleep -Seconds 1
        
        # Check if process is still running
        if (-not $serverProcess.HasExited) {
            Write-Success "MCP server started successfully"
            
            # Stop the server
            $serverProcess | Stop-Process -Force
            $serverProcess.WaitForExit(5000)
        } else {
            Write-Error "MCP server failed to start"
            exit 1
        }
    }
    catch {
        Write-Error "Failed to test server startup: $_"
        exit 1
    }
} else {
    if ($SkipServerTest) {
        Write-Warning "Skipping server startup test (requested by user)"
    } else {
        Write-Warning "Skipping server startup test in CI environment"
    }
}

# Check package.json configuration
Write-Host ""
Write-Host "Validating Package Configuration..." -ForegroundColor Blue

try {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    Write-Success "Package name: $($packageJson.name)"
    Write-Success "Version: $($packageJson.version)"
    Write-Success "Main entry: $($packageJson.main)"
    
    if ($packageJson.bin -and $packageJson.bin.'roo-mcp-server') {
        Write-Success "Binary: $($packageJson.bin.'roo-mcp-server')"
    } else {
        Write-Warning "Binary entry not found in package.json"
    }
    
    # Check if main file exists
    if (Test-Path $packageJson.main) {
        Write-Success "Main entry file exists"
    } else {
        Write-Warning "Main entry file not found (will be created by build)"
    }
}
catch {
    Write-Warning "Could not parse package.json for validation: $_"
}

# Summary
Write-Host ""
Write-Host "Deployment Test Summary" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Success "All core tests passed!"

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "1. Configure NPM_TOKEN in GitHub repository secrets"
Write-Host "2. Push your first tag: git tag v0.1.0 && git push origin v0.1.0"
Write-Host "3. Monitor GitHub Actions for automated deployment"
Write-Host "4. Verify NPM package publication"
Write-Host ""
Write-Host "See docs/deployment-guide.md for detailed setup instructions"

Write-Host ""
Write-Host "Ready for automated deployment!" -ForegroundColor Green

# Provide instructions for running the script
Write-Host ""
Write-Host "PowerShell Script Usage:" -ForegroundColor Magenta
Write-Host "Run this script: .\scripts\test-deployment.ps1"
Write-Host "Skip server test: .\scripts\test-deployment.ps1 -SkipServerTest"