# Delivery App Deployment Script for Windows PowerShell
# This script deploys the delivery app to production

param(
    [switch]$SkipValidation,
    [switch]$SkipSSL,
    [switch]$SeedDatabase
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Delivery App Deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Status "Docker found: $dockerVersion"
} catch {
    Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop first."
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Status "Docker Compose found: $composeVersion"
} catch {
    Write-Error "Docker Compose is not installed or not in PATH. Please install Docker Compose first."
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Creating from example..."
    if (Test-Path "env.production.example") {
        Copy-Item "env.production.example" ".env"
        Write-Warning "Please edit .env file with your actual values before continuing."
        Write-Host "Press any key to continue after editing .env file..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Error "env.production.example file not found. Please create .env file manually."
        exit 1
    }
}

# Load environment variables
if (-not $SkipValidation) {
    Write-Status "Validating environment variables..."
    
    # Read .env file and validate required variables
    $envContent = Get-Content ".env"
    $requiredVars = @("POSTGRES_PASSWORD", "JWT_SECRET", "JWT_REFRESH_SECRET", "VITE_GOOGLE_MAPS_API_KEY")
    
    foreach ($var in $requiredVars) {
        $found = $false
        foreach ($line in $envContent) {
            if ($line -match "^$var=" -and $line -notmatch "^$var=\s*$" -and $line -notmatch "^$var=your_") {
                $found = $true
                break
            }
        }
        if (-not $found) {
            Write-Error "Required environment variable $var is not set or has default value in .env file"
            exit 1
        }
    }
    
    Write-Status "Environment variables validated successfully"
}

# Create necessary directories
Write-Status "Creating necessary directories..."
New-Item -ItemType Directory -Force -Path "nginx\ssl" | Out-Null
New-Item -ItemType Directory -Force -Path "backend\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Generate SSL certificates (self-signed for development)
if (-not $SkipSSL) {
    if (-not (Test-Path "nginx\ssl\cert.pem") -or -not (Test-Path "nginx\ssl\key.pem")) {
        Write-Warning "SSL certificates not found. Generating self-signed certificates..."
        
        # Check if OpenSSL is available
        try {
            $opensslVersion = openssl version
            Write-Status "OpenSSL found: $opensslVersion"
            
            # Generate self-signed certificate
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
                -keyout "nginx\ssl\key.pem" `
                -out "nginx\ssl\cert.pem" `
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            
            Write-Status "SSL certificates generated"
        } catch {
            Write-Warning "OpenSSL not found. Please install OpenSSL or provide your own SSL certificates."
            Write-Warning "You can skip SSL generation with -SkipSSL parameter."
        }
    }
}

# Stop existing containers
Write-Status "Stopping existing containers..."
try {
    docker-compose -f docker-compose.prod.yml down --remove-orphans
} catch {
    Write-Warning "No existing containers to stop"
}

# Build and start services
Write-Status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
Write-Status "Waiting for services to be ready..."
Start-Sleep -Seconds 30

# Check if services are running
Write-Status "Checking service health..."

# Check backend health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status "Backend service is healthy"
    } else {
        throw "Backend returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Error "Backend service is not responding: $_"
    Write-Status "Backend logs:"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
}

# Check web portal
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Status "Web portal is accessible"
    } else {
        throw "Web portal returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Error "Web portal is not accessible: $_"
    Write-Status "Web portal logs:"
    docker-compose -f docker-compose.prod.yml logs web-portal
    exit 1
}

# Run database migrations
Write-Status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npx prisma db push

# Seed database (optional)
if ($SeedDatabase) {
    Write-Status "Seeding database..."
    docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
} else {
    $seedChoice = Read-Host "Do you want to seed the database with sample data? (y/N)"
    if ($seedChoice -eq "y" -or $seedChoice -eq "Y") {
        Write-Status "Seeding database..."
        docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
    }
}

# Show deployment summary
Write-Status "Deployment completed successfully!"
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "Web Portal: http://localhost:3000" -ForegroundColor White
Write-Host "Nginx Proxy: http://localhost:80 (HTTP) / https://localhost:443 (HTTPS)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "Restart services: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
Write-Host "Update services: docker-compose -f docker-compose.prod.yml up --build -d" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "1. Configure your domain name in the .env file" -ForegroundColor White
Write-Host "2. Set up proper SSL certificates for production" -ForegroundColor White
Write-Host "3. Configure your reverse proxy/DNS" -ForegroundColor White
Write-Host "4. Set up monitoring and logging" -ForegroundColor White
Write-Host "5. Configure backup strategies" -ForegroundColor White
Write-Host ""
Write-Status "Deployment script completed!"
