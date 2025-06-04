#!/bin/bash

# ==============================================
# DressForPleasure Backend Deployment Script
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="dressforp-backend"
DOCKER_IMAGE="dressforp/backend"
DOCKER_TAG="latest"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        log_info "Please copy .env.example to .env and configure your settings."
        exit 1
    fi
    log_success ".env file found"
}

# Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    npm ci --production=false
    log_success "Dependencies installed"
}

# Build the application
build_app() {
    log_info "Building application..."
    npm run build
    log_success "Application built successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    npm run migration:up
    log_success "Database migrations completed"
}

# Seed database (if specified)
seed_database() {
    if [ "$1" = "--seed" ]; then
        log_info "Seeding database..."
        npm run seed
        log_success "Database seeded"
    fi
}

# Build Docker image
build_docker() {
    log_info "Building Docker image..."
    docker build -t $DOCKER_IMAGE:$DOCKER_TAG .
    log_success "Docker image built: $DOCKER_IMAGE:$DOCKER_TAG"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d --build
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 10
    
    # Check health
    if docker-compose ps | grep -q "Up (healthy)"; then
        log_success "Services are running and healthy"
    else
        log_warning "Services are running but health check pending"
    fi
}

# Deploy to production (Railway/Heroku/etc.)
deploy_production() {
    local platform=$1
    
    case $platform in
        "railway")
            log_info "Deploying to Railway..."
            # Railway deployment commands
            railway up
            log_success "Deployed to Railway"
            ;;
        "heroku")
            log_info "Deploying to Heroku..."
            # Heroku deployment commands
            git push heroku main
            heroku run npm run migration:up
            log_success "Deployed to Heroku"
            ;;
        "vercel")
            log_info "Deploying to Vercel..."
            # Vercel deployment commands
            vercel --prod
            log_success "Deployed to Vercel"
            ;;
        *)
            log_error "Unknown platform: $platform"
            log_info "Supported platforms: railway, heroku, vercel"
            exit 1
            ;;
    esac
}

# Run tests
run_tests() {
    log_info "Running tests..."
    npm test
    log_success "All tests passed"
}

# Health check
health_check() {
    local url=${1:-"http://localhost:3000"}
    log_info "Performing health check on $url..."
    
    # Wait for server to start
    sleep 5
    
    if curl -f "$url/health" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        log_info "Check the logs for more information"
        exit 1
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  local           Deploy locally with Docker Compose"
    echo "  production      Deploy to production platform"
    echo "  build           Build the application only"
    echo "  test            Run tests"
    echo "  setup           Initial setup (install deps, build, migrate)"
    echo "  migrate         Run database migrations only"
    echo "  seed            Seed database with initial data"
    echo "  health          Check application health"
    echo ""
    echo "Options:"
    echo "  --seed          Include database seeding"
    echo "  --test          Run tests before deployment"
    echo "  --platform      Production platform (railway, heroku, vercel)"
    echo ""
    echo "Examples:"
    echo "  $0 local --seed"
    echo "  $0 production --platform railway"
    echo "  $0 setup"
}

# Main deployment logic
main() {
    local command=$1
    shift
    
    case $command in
        "local")
            log_info "🚀 Starting local deployment..."
            check_env
            deploy_docker_compose
            health_check
            log_success "🎉 Local deployment completed!"
            ;;
            
        "production")
            local platform=""
            local run_test=false
            
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --platform)
                        platform="$2"
                        shift 2
                        ;;
                    --test)
                        run_test=true
                        shift
                        ;;
                    *)
                        log_error "Unknown option: $1"
                        usage
                        exit 1
                        ;;
                esac
            done
            
            if [ -z "$platform" ]; then
                log_error "Platform not specified"
                usage
                exit 1
            fi
            
            log_info "🚀 Starting production deployment to $platform..."
            check_env
            install_deps
            
            if [ "$run_test" = true ]; then
                run_tests
            fi
            
            build_app
            deploy_production $platform
            log_success "🎉 Production deployment completed!"
            ;;
            
        "build")
            log_info "🔨 Building application..."
            check_env
            install_deps
            build_app
            log_success "🎉 Build completed!"
            ;;
            
        "test")
            log_info "🧪 Running tests..."
            check_env
            install_deps
            run_tests
            log_success "🎉 Tests completed!"
            ;;
            
        "setup")
            local include_seed=false
            
            if [ "$1" = "--seed" ]; then
                include_seed=true
            fi
            
            log_info "⚙️  Initial setup..."
            check_env
            install_deps
            build_app
            run_migrations
            
            if [ "$include_seed" = true ]; then
                seed_database --seed
            fi
            
            log_success "🎉 Setup completed!"
            ;;
            
        "migrate")
            log_info "🗄️  Running migrations..."
            check_env
            run_migrations
            log_success "🎉 Migrations completed!"
            ;;
            
        "seed")
            log_info "🌱 Seeding database..."
            check_env
            seed_database --seed
            log_success "🎉 Database seeded!"
            ;;
            
        "health")
            local url=${1:-"http://localhost:3000"}
            health_check $url
            ;;
            
        "help"|"--help"|"-h"|"")
            usage
            ;;
            
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Script header
echo "================================================"
echo "🛍️  DressForPleasure Backend Deployment Script"
echo "================================================"
echo ""

# Run main function with all arguments
main "$@"
