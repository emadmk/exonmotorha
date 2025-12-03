# اکسون موتور | Exon Motor

سیستم مدیریت خدمات تعمیر و نگهداری خودرو در محل

## 🚀 راه‌اندازی سریع

### پیش‌نیازها
- Ubuntu 22.04+
- Node.js 20+
- MongoDB 7+
- PM2

### نصب روی سرور خام

```bash
# کلون پروژه
git clone <repository-url>
cd exonmotor

# اجرای اسکریپت نصب
sudo chmod +x deploy.sh
sudo ./deploy.sh
```

### نصب دستی

#### ۱. نصب وابستگی‌ها

```bash
# نصب Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# نصب MongoDB
# دستورات نصب MongoDB را از سایت رسمی دنبال کنید

# نصب PM2
sudo npm install -g pm2
```

#### ۲. راه‌اندازی بک‌اند

```bash
cd backend
npm install
cp .env.example .env
# ویرایش .env با تنظیمات واقعی
npm run build
npm run seed  # ایجاد کاربران اولیه
npm start
```

#### ۳. راه‌اندازی فرانت‌اند

```bash
cd frontend
npm install
npm run build
npm run preview
```

#### ۴. PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 📁 ساختار پروژه

```
exonmotor/
├── backend/
│   ├── src/
│   │   ├── config/         # پیکربندی
│   │   ├── controllers/    # کنترلرها
│   │   ├── middleware/     # میدل‌ورها
│   │   ├── models/         # مدل‌های MongoDB
│   │   ├── routes/         # مسیرها
│   │   ├── services/       # سرویس‌ها (SMS, Payment)
│   │   └── utils/          # توابع کمکی
│   └── uploads/            # فایل‌های آپلود شده
│
├── frontend/
│   ├── src/
│   │   ├── components/     # کامپوننت‌ها
│   │   ├── pages/          # صفحات
│   │   ├── services/       # سرویس‌های API
│   │   ├── stores/         # Zustand stores
│   │   └── utils/          # توابع کمکی
│   └── dist/               # خروجی build
│
├── ecosystem.config.cjs    # پیکربندی PM2
├── deploy.sh               # اسکریپت نصب
└── README.md
```

## 🔧 پیکربندی

### متغیرهای محیطی (backend/.env)

```env
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb://localhost:27017/exonmotor

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

KAVENEGAR_API_KEY=your-kavenegar-api-key
ZARINPAL_MERCHANT_ID=your-zarinpal-merchant-id
ZARINPAL_SANDBOX=false

FRONTEND_URL=https://exonmotor.ir
```

## 👥 کاربران اولیه

بعد از اجرای `npm run seed`:

| نقش | شماره موبایل |
|-----|-------------|
| مدیر | 09132952622 |
| تکنسین | 09199061003 |
| مشتری | 09133422859 |

## 🌐 پورت‌ها

| سرویس | پورت |
|-------|------|
| Frontend | 3000 |
| Backend API | 5000 |
| MongoDB | 27017 |

## 📱 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - ارسال کد OTP
- `POST /api/auth/verify-otp` - تایید OTP
- `POST /api/auth/refresh` - تمدید توکن
- `POST /api/auth/logout` - خروج

### Orders
- `POST /api/orders` - ثبت سفارش
- `GET /api/orders/my` - سفارش‌های من
- `GET /api/orders/current` - سفارش فعال
- `GET /api/orders/:id` - جزئیات سفارش

### Admin
- `GET /api/admin/stats` - آمار داشبورد
- `GET /api/orders/admin/all` - همه سفارش‌ها
- `PUT /api/orders/:id/status` - تغییر وضعیت
- `PUT /api/orders/:id/assign` - اختصاص تکنسین

## 🔐 SSL

### گواهی خودامضا (توسعه)
اسکریپت deploy.sh گواهی خودامضا ایجاد می‌کند.

### Let's Encrypt (تولید)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d exonmotor.ir -d www.exonmotor.ir
```

## 📞 پشتیبانی

- ایمیل: emad.devel@gmail.com
- دامنه: exonmotor.ir

## 📄 License

MIT
