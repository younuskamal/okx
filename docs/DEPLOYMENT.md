# Deployment Guide

## Production Deployment

### Prerequisites
- Server with Docker and Docker Compose
- Domain name (optional)
- SSL certificate (for HTTPS)

### Steps

1. **Clone repository:**
```bash
git clone <repository-url>
cd okx
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with production values
```

3. **Build and start:**
```bash
docker-compose up -d --build
```

4. **Set up reverse proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }

    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

5. **Enable HTTPS (Let's Encrypt):**
```bash
certbot --nginx -d your-domain.com
```

## Monitoring

- Check logs: `docker-compose logs -f`
- Health check: `curl http://localhost:8000/api/health`
- Monitor resources: `docker stats`

## Backup

- Database: `trading_system.db`
- Config: `config.json`
- Settings: Backed up in database

## Updates

```bash
git pull
docker-compose down
docker-compose up -d --build
```


