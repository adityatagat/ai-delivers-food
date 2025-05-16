# Production Deployment Guide

This guide outlines the steps to deploy AI Delivers Food! to a production environment.

## Prerequisites

- Docker and Docker Compose installed on the production server
- Domain name and SSL certificate
- MongoDB Atlas account (recommended for production database)
- Google Maps API key with billing enabled
- A server with at least:
  - 2 CPU cores
  - 4GB RAM
  - 20GB storage
  - Ubuntu 20.04 LTS or later

## Production Configuration

### 1. Environment Variables

Create a `.env` file in the root directory with production values:

```env
# MongoDB Configuration
MONGODB_USERNAME=your_production_username
MONGODB_PASSWORD=your_strong_password
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai_delivers_food

# JWT Configuration
JWT_SECRET=your_very_long_random_secret
JWT_EXPIRES_IN=24h

# Google Maps
GOOGLE_MAPS_API_KEY=your_production_api_key
RESTAURANT_ADDRESS=your_restaurant_address

# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-domain.com

# SSL Configuration (if using Let's Encrypt)
SSL_EMAIL=your-email@domain.com
DOMAIN=your-domain.com
```

### 2. SSL Configuration

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

3. Update nginx.conf to use SSL:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # ... rest of your nginx configuration
}
```

### 3. Production Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGODB_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGODB_PASSWORD}
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - RESTAURANT_ADDRESS=${RESTAURANT_ADDRESS}
      - CLIENT_URL=${CLIENT_URL}
    depends_on:
      - mongodb
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - backend
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
```

## Deployment Steps

1. **Server Setup**:
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Application Deployment**:
```bash
# Clone repository
git clone https://github.com/yourusername/ai-delivers-food.git
cd ai-delivers-food

# Set up environment variables
cp .env.example .env
# Edit .env with production values

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build
```

3. **Monitoring Setup**:
```bash
# Install monitoring tools
docker run -d \
  --name=prometheus \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d \
  --name=grafana \
  -p 3000:3000 \
  grafana/grafana
```

## CI/CD Pipeline Setup

### 1. GitHub Actions Workflow

Create `.github/workflows/main.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
        env:
          MONGO_INITDB_ROOT_USERNAME: test
          MONGO_INITDB_ROOT_PASSWORD: test

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install Backend Dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run Backend Tests
      run: |
        cd backend
        npm test
      env:
        NODE_ENV: test
        MONGODB_URI: mongodb://test:test@localhost:27017/test?authSource=admin
        JWT_SECRET: test_secret
        GOOGLE_MAPS_API_KEY: test_key
        RESTAURANT_ADDRESS: test_address
        CLIENT_URL: http://localhost:3000

    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run Frontend Tests
      run: |
        cd frontend
        npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and Push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: yourusername/ai-delivers-food-backend:latest
    
    - name: Build and Push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: yourusername/ai-delivers-food-frontend:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Production
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /path/to/app
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
```

### 2. Required Secrets

Add the following secrets to your GitHub repository:

- `DOCKERHUB_USERNAME`: Your DockerHub username
- `DOCKERHUB_TOKEN`: Your DockerHub access token
- `SERVER_HOST`: Production server hostname/IP
- `SERVER_USERNAME`: SSH username for production server
- `SERVER_SSH_KEY`: SSH private key for production server

### 3. Environment Variables

Create `.env.example` files for both backend and frontend:

```env
# Backend .env.example
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_delivers_food
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_ADDRESS=your_restaurant_address
CLIENT_URL=http://localhost:3000

# Frontend .env.example
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Docker Compose for CI/CD

Create `docker-compose.ci.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    environment:
      - MONGO_INITDB_ROOT_USERNAME=test
      - MONGO_INITDB_ROOT_PASSWORD=test
    ports:
      - "27017:27017"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=test
      - MONGODB_URI=mongodb://test:test@mongodb:27017/test?authSource=admin
      - JWT_SECRET=test_secret
      - GOOGLE_MAPS_API_KEY=test_key
      - RESTAURANT_ADDRESS=test_address
      - CLIENT_URL=http://localhost:3000
    depends_on:
      - mongodb
    command: npm test

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_URL=http://localhost:5000
      - REACT_APP_GOOGLE_MAPS_API_KEY=test_key
    command: npm test
```

### 5. Pipeline Stages

The CI/CD pipeline consists of the following stages:

1. **Test Stage**:
   - Runs on every push and pull request
   - Sets up MongoDB service container
   - Installs dependencies
   - Runs backend and frontend tests
   - Ensures code quality

2. **Build Stage**:
   - Runs only on main branch after successful tests
   - Builds Docker images for backend and frontend
   - Pushes images to DockerHub
   - Tags images with latest version

3. **Deploy Stage**:
   - Runs only on main branch after successful build
   - Connects to production server via SSH
   - Pulls latest Docker images
   - Updates running containers
   - Ensures zero-downtime deployment

### 6. Monitoring the Pipeline

1. **GitHub Actions Dashboard**:
   - View pipeline status at `https://github.com/yourusername/ai-delivers-food/actions`
   - Monitor test results and deployment status
   - View logs for each stage

2. **Notifications**:
   - Set up Slack notifications for pipeline events
   - Configure email notifications for failed deployments
   - Monitor deployment status in real-time

### 7. Rollback Procedure

In case of deployment issues:

```bash
# SSH into production server
ssh user@your-server

# Rollback to previous version
cd /path/to/app
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --no-recreate

# Or rollback to specific version
docker-compose -f docker-compose.prod.yml up -d --no-recreate backend=yourusername/ai-delivers-food-backend:v1.0.0
```

## Maintenance

### Backup Strategy

1. **Database Backups**:
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"

# Backup MongoDB
docker exec mongodb mongodump --out /backup
docker cp mongodb:/backup $BACKUP_DIR/mongodb_$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$TIMESTAMP.tar.gz $BACKUP_DIR/mongodb_$TIMESTAMP

# Remove uncompressed backup
rm -rf $BACKUP_DIR/mongodb_$TIMESTAMP

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +7 -delete
EOF

# Make script executable
chmod +x backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 0 * * * /path/to/backup.sh") | crontab -
```

### Monitoring

1. **Set up alerts**:
   - Configure Grafana alerts for:
     - High CPU usage (>80%)
     - High memory usage (>80%)
     - Service down
     - High response time (>1s)

2. **Log Management**:
```bash
# Set up log rotation
cat > /etc/logrotate.d/ai-delivers-food << 'EOF'
/var/log/ai-delivers-food/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF
```

### Scaling

1. **Horizontal Scaling**:
```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

2. **Load Balancer Configuration**:
```nginx
upstream backend_servers {
    server backend:5000;
    server backend:5001;
    server backend:5002;
}

server {
    # ... SSL configuration ...

    location /api {
        proxy_pass http://backend_servers;
        # ... other proxy settings ...
    }
}
```

## Security Checklist

- [ ] All services are running in production mode
- [ ] SSL/TLS is properly configured
- [ ] Environment variables are properly set
- [ ] Database credentials are secure
- [ ] JWT secret is strong and unique
- [ ] Regular security updates are applied
- [ ] Firewall is configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Regular backups are scheduled
- [ ] Monitoring and alerting are set up
- [ ] Log rotation is configured
- [ ] Access logs are being monitored
- [ ] Security headers are properly set
- [ ] Dependencies are up to date

## Troubleshooting

### Common Issues

1. **Service Not Starting**:
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

2. **Database Connection Issues**:
```bash
# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Test connection
docker exec -it mongodb mongo --eval "db.serverStatus()"
```

3. **High Resource Usage**:
```bash
# Check container stats
docker stats

# Check system resources
htop
```

### Recovery Procedures

1. **Service Recovery**:
```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Restart all services
docker-compose -f docker-compose.prod.yml restart
```

2. **Database Recovery**:
```bash
# Restore from backup
docker exec -i mongodb mongorestore --archive < backup_file
```

## Support

For production support:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review monitoring dashboards
3. Check system resources
4. Contact the development team

Remember to keep this guide updated as the application evolves. 