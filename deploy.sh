#!/bin/bash

# اکسون موتور - اسکریپت نصب و راه‌اندازی
# Exon Motor - Deployment Script

set -e

echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║   🚗 اکسون موتور - نصب و راه‌اندازی                ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ لطفاً با دسترسی root اجرا کنید: sudo bash deploy.sh"
  exit 1
fi

# Update system
echo "📦 به‌روزرسانی سیستم..."
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 نصب Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
node -v
npm -v

# Install MongoDB
echo "📦 نصب MongoDB..."
if ! command -v mongod &> /dev/null; then
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update
  apt install -y mongodb-org
  systemctl start mongod
  systemctl enable mongod
fi
echo "✅ MongoDB نصب شد"

# Install PM2
echo "📦 نصب PM2..."
npm install -g pm2

# Install Nginx
echo "📦 نصب Nginx..."
apt install -y nginx

# Create project directory
PROJECT_DIR="/var/www/exonmotor"
echo "📁 ایجاد پوشه پروژه در ${PROJECT_DIR}..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Copy project files (assuming they're in the current directory)
echo "📋 کپی فایل‌های پروژه..."
# If running from project directory:
# cp -r . $PROJECT_DIR/

# Install backend dependencies
echo "📦 نصب وابستگی‌های بک‌اند..."
cd backend
npm install
npm run build
cd ..

# Install frontend dependencies
echo "📦 نصب وابستگی‌های فرانت‌اند..."
cd frontend
npm install
npm run build
cd ..

# Create .env file if not exists
if [ ! -f "backend/.env" ]; then
  echo "⚙️ ایجاد فایل .env..."
  cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb://localhost:27017/exonmotor

JWT_SECRET=your-super-secret-jwt-key-change-this-$(openssl rand -hex 32)
JWT_REFRESH_SECRET=your-refresh-secret-$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

KAVENEGAR_API_KEY=
ZARINPAL_MERCHANT_ID=
ZARINPAL_SANDBOX=false

FRONTEND_URL=https://exonmotor.ir

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
  echo "⚠️ لطفاً فایل backend/.env را با API Key های واقعی پر کنید"
fi

# Create uploads directory
mkdir -p backend/uploads/{vehicles,avatars,documents,chat}
chown -R www-data:www-data backend/uploads

# Seed database
echo "🌱 ایجاد داده‌های اولیه..."
cd backend
npm run seed
cd ..

# Configure Nginx
echo "⚙️ پیکربندی Nginx..."
cat > /etc/nginx/sites-available/exonmotor << 'EOF'
server {
    listen 80;
    server_name exonmotor.ir www.exonmotor.ir;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name exonmotor.ir www.exonmotor.ir;

    ssl_certificate /etc/ssl/certs/exonmotor.crt;
    ssl_certificate_key /etc/ssl/private/exonmotor.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /var/www/exonmotor/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Generate self-signed SSL certificate
echo "🔐 ایجاد گواهی SSL خودامضا..."
mkdir -p /etc/ssl/certs /etc/ssl/private
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/exonmotor.key \
  -out /etc/ssl/certs/exonmotor.crt \
  -subj "/C=IR/ST=Tehran/L=Tehran/O=ExonMotor/CN=exonmotor.ir"

# Enable site
ln -sf /etc/nginx/sites-available/exonmotor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# Start PM2
echo "🚀 راه‌اندازی برنامه با PM2..."
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Setup firewall
echo "🔥 پیکربندی فایروال..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║   ✅ نصب با موفقیت انجام شد!                      ║"
echo "║                                                   ║"
echo "║   🌐 آدرس سایت: https://exonmotor.ir             ║"
echo "║   🔧 API: https://exonmotor.ir/api               ║"
echo "║                                                   ║"
echo "║   ⚠️ توجه:                                        ║"
echo "║   - فایل backend/.env را با API Key پر کنید      ║"
echo "║   - گواهی SSL معتبر (Let's Encrypt) نصب کنید    ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo "دستورات مفید:"
echo "  pm2 status          - مشاهده وضعیت"
echo "  pm2 logs            - مشاهده لاگ‌ها"
echo "  pm2 restart all     - راه‌اندازی مجدد"
echo ""
