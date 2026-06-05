# Enterprise Production Deployment Guide: FastAPI & Nginx

This guide outlines how to deploy **SecureRedact PDF** behind Nginx as a reverse proxy. Because the app caches preview pages and files locally inside `temp_workspace/` for active sessions, scaling to multiple backend servers requires **Sticky Sessions (Session Affinity)**. This ensures all requests from a single client hit the same backend server.

---

## 1. Nginx Reverse Proxy Configuration

Create or update your Nginx server block configuration (typically `/etc/nginx/sites-available/default` on Linux).

```nginx
# Rate Limiting Configuration
# Limits clients to a rate of 10 requests per minute for file uploads, bursts up to 5
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=10r/m;
# General API rate limiting (1 request per second, burst up to 10)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=1r/s;

# Upstream Backend Server Pools with Sticky Sessions
upstream fastapi_app {
    # ip_hash pins a client IP address to the same backend server
    ip_hash;
    
    server 127.0.0.1:8000;
    # Add other local ports or server nodes here for local horizontal scaling:
    # server 127.0.0.1:8001;
    # server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name secureredact.example.com;

    # Redirect all HTTP traffic to HTTPS (Recommended)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name secureredact.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/secureredact.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/secureredact.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Global proxy configurations
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;

    # 1. Frontend & Static Assets (Publicly cache CSS/JS for 1 day)
    location /static/ {
        proxy_pass http://fastapi_app;
        proxy_buffering on;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # 2. Main API & UI Entrypoints (Ensure HTML is not cached)
    location / {
        proxy_pass http://fastapi_app;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # 3. Secure File Upload Endpoints (With strict rate limits & body size limits)
    location ~ ^/api/(upload|merge/upload|split/upload|security/upload|compress/upload|organize/upload|watermark/upload|convert/upload-pdf|convert/upload-images) {
        # Limit the client request body to 50MB (matching FastAPI safe_save_upload cap)
        client_max_body_size 50M;
        
        # Apply the Nginx rate limit to protect backend resources from DoS
        limit_req zone=upload_limit burst=5 nodelay;
        
        proxy_pass http://fastapi_app;
    }

    # 4. General API Endpoints
    location /api/ {
        client_max_body_size 2M;
        limit_req zone=api_limit burst=10 nodelay;
        proxy_pass http://fastapi_app;
    }
}
```

---

## 2. Gunicorn / ASGI Production Server Startup

In a production environment, run Uvicorn wrapped by Gunicorn to manage worker processes efficiently. 

Install Gunicorn:
```bash
pip install gunicorn
```

Start the application with 4 workers (scale up/down depending on CPU cores):
```bash
export APP_DEBUG=false
export APP_HOST=127.0.0.1
export APP_PORT=8000

gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind $APP_HOST:$APP_PORT
```

---

## 3. Ephemeral Disk Space Maintenance

Although the application runs a background cleanup worker thread that sweeps `temp_workspace/` every 60 seconds and deletes directories older than 15 minutes, we recommend adding a fallback daily cron job on the system hosting the server to ensure clean slates:

```bash
# Open crontab editor
crontab -e
```

Add this line to automatically clean up orphaned files older than 1 day every night at 2:00 AM:
```cron
0 2 * * * find /path/to/your/app/temp_workspace/ -mindepth 1 -maxdepth 1 -mmin +1440 -exec rm -rf {} \;
```
