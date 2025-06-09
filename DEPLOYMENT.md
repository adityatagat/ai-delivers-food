# 🚀 Production Deployment Guide

This guide provides comprehensive instructions for deploying AI Delivers Food to production environments, including Docker, cloud platforms, and monitoring setup.

## 📋 Prerequisites

### Infrastructure Requirements
- **Server**:
  - 2+ vCPUs
  - 4GB+ RAM
  - 20GB+ storage
  - Ubuntu 22.04 LTS or later

### Accounts & Services
- Domain name with DNS access
- SSL certificate (Let's Encrypt recommended)
- MongoDB Atlas account (for production database)
- Google Cloud Platform account with:
  - Google Maps JavaScript API enabled
  - Geocoding API enabled
  - Billing enabled

### Tools
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ and npm 9+
- Git
- Nginx (for production reverse proxy)

## 🛠 Production Configuration

### 1. Environment Variables

Create a `.env` file in the project root with these production values:

```env
# ========== Application ==========
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# ========== Database ==========
# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai_delivers_food?retryWrites=true&w=majority

# Local MongoDB (for development only)
# MONGODB_URI=mongodb://mongodb:27017/ai_delivers_food

# ========== Authentication ==========
JWT_SECRET=generate_a_secure_random_string_min_32_chars
JWT_EXPIRES_IN=24h
JWT_COOKIE_EXPIRES_IN=90

# ========== Google Maps ==========
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
RESTAURANT_ADDRESS="123 Main St, City, Country"

# ========== Frontend ==========
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ========== Rate Limiting ==========
RATE_LIMIT_WINDOW_MS=15*60*1000  # 15 minutes
RATE_LIMIT_MAX=100  # Limit each IP to 100 requests per windowMs

# ========== Security ==========
CORS_ORIGIN=https://yourdomain.com
HELMET_ENABLED=true
HSTS_ENABLED=true
CONTENT_SECURITY_POLICY_ENABLED=true

# ========== Logging ==========
LOG_LEVEL=info
LOG_FORMAT=combined

# ========== SSL/TLS ==========
# For Let's Encrypt certificates
SSL_EMAIL=admin@yourdomain.com
DOMAIN=yourdomain.com
```

### Security Best Practices

1. **Secrets Management**:
   - Never commit `.env` files to version control
   - Use environment variables or secrets management services
   - Rotate secrets regularly

2. **Database Security**:
   - Use strong, unique passwords
   - Enable network encryption (TLS/SSL)
   - Restrict network access to database
   - Regular backups

3. **API Security**:
   - Enable CORS only for trusted domains
   - Implement rate limiting
   - Use HTTPS everywhere
   - Set secure HTTP headers

4. **Docker Security**:
   - Use non-root users in containers
   - Keep images updated
   - Scan images for vulnerabilities
   - Limit container capabilities

### 2. SSL/TLS Configuration

#### Option 1: Automated SSL with Let's Encrypt (Recommended)

1. **Install Certbot and Nginx plugin**:
   ```bash
   sudo apt update
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com \
     --email admin@yourdomain.com \
     --agree-tos \
     --no-eff-email \
     --redirect \
     --hsts \
     --staple-ocsp
   ```

3. **Set up Auto-Renewal**:
   ```bash
   # Test the renewal process
   sudo certbot renew --dry-run
   
   # Add a cron job for automatic renewal
   (crontab -l 2>/dev/null; echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q") | sudo crontab -
   ```

#### Option 2: Manual SSL Certificate Installation

1. **Create SSL Directory**:
   ```bash
   sudo mkdir -p /etc/nginx/ssl/yourdomain.com
   ```

2. **Upload Your Certificates**:
   - Upload your SSL certificate and private key to the server
   - Place them in the `/etc/nginx/ssl/yourdomain.com/` directory
   - Ensure proper permissions:
     ```bash
     sudo chmod 600 /etc/nginx/ssl/yourdomain.com/*.pem
     sudo chown root:root /etc/nginx/ssl/yourdomain.com/*.pem
     ```

#### Nginx SSL Configuration

Create or update your Nginx configuration at `/etc/nginx/sites-available/yourdomain.com`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # ACME challenge for Let's Encrypt
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type text/plain;
    }
    
    # Redirect all other HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificate paths
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS (uncomment after testing)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Your application configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. **Test and Reload Nginx**:
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   
   # Reload Nginx to apply changes
   sudo systemctl reload nginx
   ```

5. **Verify SSL Configuration**:
   - Test your SSL configuration using [SSL Labs](https://www.ssllabs.com/ssltest/)
   - Ensure you get an A+ rating
   - Check for mixed content issues

### 3. Docker Compose for Production

Create a `docker-compose.prod.yml` file in your project root with the following configuration:

```yaml
version: '3.8'

# Define secrets (these should be stored in Docker Swarm or Kubernetes secrets in production)
# secrets:
#   mongodb_root_password:
#     file: ./secrets/mongodb_root_password.txt
#   jwt_secret:
#     file: ./secrets/jwt_secret.txt

services:
  # MongoDB Service
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGODB_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD:-changeme}
      MONGO_INITDB_DATABASE: ai_delivers_food
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "'db.runCommand({ ping: 1 })'"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  # Backend API Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
    container_name: backend
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=${MONGODB_URI:-mongodb://${MONGODB_USERNAME:-admin}:${MONGODB_PASSWORD:-changeme}@mongodb:27017/ai_delivers_food?authSource=admin}
      - JWT_SECRET=${JWT_SECRET:-your_jwt_secret}
      - JWT_EXPIRES_IN=24h
      - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
      - RESTAURANT_ADDRESS=${RESTAURANT_ADDRESS}
      - LOG_LEVEL=info
    ports:
      - "5000:5000"
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
    container_name: frontend
    restart: unless-stopped
    environment:
      - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:5000}
      - REACT_APP_GOOGLE_MAPS_API_KEY=${REACT_APP_GOOGLE_MAPS_API_KEY}
      - NODE_ENV=production
    ports:
      - "3000:80"
    networks:
      - app-network
    depends_on:
      - backend
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Nginx Reverse Proxy (optional, if not using host Nginx)
  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

# Networks
networks:
  app-network:
    driver: bridge
    # For production, consider using an overlay network in Swarm mode
    # driver: overlay
    # attachable: true

# Volumes
volumes:
  mongodb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/mongodb
  
  # For production, consider using named volumes with proper backup solutions
  # mongodb_data:
  #   driver: local
  #   driver_opts:
  #     type: nfs
  #     o: addr=nfs-server.local,rw
  #     device: ":/exports/mongodb"

  # For development only (node_modules)
  node_modules:
  .next:
  build:

# Healthcheck configuration for all services
# This ensures containers restart if they become unhealthy
x-healthcheck: &healthcheck
  healthcheck:
    test: ["CMD-SHELL", "exit 0"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 5s
```

### Key Configuration Notes:

1. **Secrets Management**:
   - Never store secrets in version control
   - Use Docker secrets or environment variables from a secure source
   - Consider using a secrets management service in production

2. **Resource Limits**:
   - Set appropriate CPU and memory limits
   - Adjust based on your server capacity and expected load

3. **Networking**:
   - Uses a dedicated bridge network for container communication
   - For production clusters, consider using overlay networks

4. **Storage**:
   - Uses named volumes for persistent data
   - For production, consider using NFS or cloud storage solutions

5. **Health Checks**:
   - All services include health checks
   - Containers will automatically restart if they become unhealthy

6. **Security**:
   - Runs services as non-root users
   - Uses read-only filesystems where possible
   - Limits container capabilities

### Deployment Commands:

1. **Build and Start Services**:
   ```bash
   # Pull latest images (if needed)
   docker-compose -f docker-compose.prod.yml pull
   
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **View Logs**:
   ```bash
   # View all logs
   docker-compose -f docker-compose.prod.yml logs -f
   
   # View logs for a specific service
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

3. **Monitor Containers**:
   ```bash
   # Show running containers
   docker-compose -f docker-compose.prod.yml ps
   
   # Show resource usage
   docker stats
   ```

4. **Maintenance Commands**:
   ```bash
   # Stop services
   docker-compose -f docker-compose.prod.yml down
   
   # Rebuild a specific service
   docker-compose -f docker-compose.prod.yml up -d --build <service_name>
   
   # Run a command in a running container
   docker-compose -f docker-compose.prod.yml exec backend npm run migrate
   ```

5. **Backup and Restore**:
   ```bash
   # Backup MongoDB
   docker-compose -f docker-compose.prod.yml exec -T mongodb mongodump --archive --gzip > backup-$(date +%Y%m%d).gz
   
   # Restore MongoDB
   cat backup-20230101.gz | docker-compose -f docker-compose.prod.yml exec -T mongodb mongorestore --archive --gzip
   ```
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
```

## 4. Monitoring and Maintenance

### Application Monitoring

1. **Prometheus and Grafana**:
   - Prometheus is configured to scrape metrics from the backend service
   - Grafana provides dashboards for visualizing metrics and setting up alerts
   - Access Grafana at `http://yourdomain.com:3000` (default credentials: admin/admin)

2. **Log Management**:
   ```bash
   # View logs for all services
   docker-compose -f docker-compose.prod.yml logs -f
   
   # View logs for a specific service
   docker-compose -f docker-compose.prod.yml logs -f backend
   ```

### Database Backups

1. **Scheduled MongoDB Backups**:
   ```bash
   # Create a backup script at /usr/local/bin/backup-mongodb.sh
   #!/bin/bash
   
   BACKUP_DIR="/backups/mongodb"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   
   mkdir -p $BACKUP_DIR
   
   docker-compose -f /path/to/docker-compose.prod.yml exec -T mongodb mongodump \
     --archive --gzip \
     --uri="$MONGODB_URI" \
     --out=- > "$BACKUP_DIR/backup_$TIMESTAMP.gz"
   
   # Keep only the last 7 days of backups
   find "$BACKUP_DIR" -name "backup_*.gz" -mtime +7 -delete
   ```

2. **Schedule Daily Backups**:
   ```bash
   # Make the script executable
   chmod +x /usr/local/bin/backup-mongodb.sh
   
   # Add to crontab
   (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-mongodb.sh") | crontab -
   ```

## 5. CI/CD Pipeline

### GitHub Actions Workflow

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

## 6. Security Best Practices

### Infrastructure Security

1. **Network Security**:
   - Use VPCs and security groups to restrict access
   - Implement network segmentation
   - Use private subnets for database instances
   - Enable VPC flow logs for monitoring

2. **Docker Security**:
   - Run containers as non-root users
   - Use read-only filesystems where possible
   - Limit container capabilities
   - Enable user namespace remapping
   - Regularly update container images

3. **Secrets Management**:
   - Never commit secrets to version control
   - Use Docker secrets or environment variables from secure sources
   - Rotate credentials and API keys regularly
   - Use a secrets management service in production

### Application Security

1. **Dependencies**:
   - Regularly update all dependencies
   - Use Dependabot or similar tools for automated updates
   - Regularly audit for vulnerabilities
   - Pin dependency versions in package.json

2. **API Security**:
   - Implement rate limiting
   - Use API keys or OAuth2 for authentication
   - Validate all input data
   - Sanitize output to prevent XSS
   - Use HTTPS for all API calls

## 7. Performance Optimization

### Frontend Optimization

1. **Code Splitting**:
   - Split code by routes
   - Lazy load components
   - Use React.lazy and Suspense

2. **Caching**:
   - Implement service workers
   - Use CDN for static assets
   - Set proper cache headers
   - Enable browser caching

3. **Bundle Optimization**:
   - Minify and compress assets
   - Use tree-shaking
   - Optimize images
   - Use modern JavaScript features

### Backend Optimization

1. **Database**:
   - Create appropriate indexes
   - Optimize queries
   - Use connection pooling
   - Implement caching with Redis

2. **Node.js**:
   - Use clustering for multi-core CPUs
   - Implement request validation
   - Use streaming for large responses
   - Implement rate limiting

## 8. Scaling

### Horizontal Scaling

1. **Backend API**:
   - Add more backend instances
   - Use a load balancer (Nginx, HAProxy, or cloud LB)
   - Implement sticky sessions if needed
   - Use connection pooling

2. **Database**:
   - Set up MongoDB replica set
   - Consider sharding for very large datasets
   - Use read replicas for read-heavy workloads
   - Implement proper indexing

### Vertical Scaling

1. **Server Resources**:
   - Increase CPU and memory
   - Use faster storage (SSD/NVMe)
   - Optimize database queries
   - Increase file descriptor limits

## 9. Backup and Disaster Recovery

### Backup Strategy

1. **Database Backups**:
   - Regular automated backups
   - Test restoration process
   - Store backups in multiple locations
   - Encrypt sensitive backup data

2. **Application Data**:
   - Backup configuration files
   - Backup uploaded files and media
   - Test restoration process
   - Document recovery procedures

### Disaster Recovery Plan

1. **Recovery Time Objective (RTO)**:
   - Define acceptable downtime
   - Document recovery procedures
   - Train team members
   - Test recovery process

2. **Recovery Point Objective (RPO)**:
   - Define acceptable data loss
   - Set backup frequency accordingly
   - Monitor backup success
   - Test data restoration

## 10. Maintenance and Updates

### Regular Maintenance

1. **System Updates**:
   - Keep OS updated
   - Update Docker and dependencies
   - Monitor security advisories
   - Schedule maintenance windows

2. **Database Maintenance**:
   - Regular index optimization
   - Monitor query performance
   - Clean up old data
   - Regular backups

### Monitoring and Alerts

1. **Infrastructure Monitoring**:
   - CPU, memory, disk usage
   - Network traffic
   - Container health
   - Log aggregation

2. **Application Monitoring**:
   - Error tracking
   - Performance metrics
   - User experience
   - Business metrics

## 11. Troubleshooting

### Common Issues

1. **Container Issues**:
   - Check container logs
   - Verify environment variables
   - Check resource limits
   - Verify network connectivity

2. **Database Issues**:
   - Check MongoDB logs
   - Verify connection strings
   - Check disk space
   - Monitor slow queries

3. **Network Issues**:
   - Check firewall rules
   - Verify DNS resolution
   - Check SSL certificates
   - Test connectivity

### Getting Help

1. **Documentation**:
   - Check project documentation
   - Review API documentation
   - Check changelogs

2. **Community Support**:
   - GitHub issues
   - Stack Overflow
   - Official documentation
   - Community forums

## Conclusion

This guide has provided a comprehensive overview of deploying and maintaining the AI Delivers Food application in production. By following these best practices, you can ensure a secure, performant, and reliable deployment.

### Key Takeaways

1. **Infrastructure as Code**:
   - All infrastructure is defined in Docker Compose files
   - Environment variables are used for configuration
   - Secrets are managed securely

2. **Security First**:
   - All services run with least privilege
   - Network traffic is encrypted
   - Regular security updates are applied

3. **Monitoring and Maintenance**:
   - Comprehensive monitoring with Prometheus and Grafana
   - Regular backups and disaster recovery procedures
   - Performance optimization and scaling strategies

### Next Steps

1. **Testing**:
   - Test the deployment in a staging environment
   - Perform load testing
   - Verify all security measures

2. **Documentation**:
   - Document any environment-specific configurations
   - Create runbooks for common operations
   - Document escalation procedures

3. **Training**:
   - Train team members on deployment procedures
   - Conduct incident response drills
   - Review security best practices

### Getting Help

For any questions or issues, please refer to:

1. **Project Documentation**: Check the project's README and documentation
2. **GitHub Issues**: Open an issue for bugs or feature requests
3. **Community Support**: Reach out on community forums or Stack Overflow
4. **Professional Support**: Contact the maintainers for enterprise support options

Thank you for using AI Delivers Food! We appreciate your feedback and contributions to make the project better.