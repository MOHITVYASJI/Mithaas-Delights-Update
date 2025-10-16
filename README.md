# 🍬 Mithaas Delights - Indian Sweet Shop E-Commerce

A full-stack e-commerce platform for selling traditional Indian sweets (mithai), namkeen, and festive treats.

![Status](https://img.shields.io/badge/Status-Ready%20for%20Deployment-green)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248)

---

## ✨ Features

### 🛒 Customer Features
- Browse products by categories (Mithai, Namkeen, Farsan, Bengali Sweets, etc.)
- Product search and filtering
- Shopping cart with variant selection (250g, 500g, 1kg)
- Multiple payment methods (COD, Razorpay)
- Order tracking
- Product reviews with images
- WhatsApp order confirmation
- Discount coupons

### 👨‍💼 Admin Features
- Product management (CRUD)
- Category management
- Order management with status updates
- Coupon creation (percentage, flat, BOGO)
- Banner management for festivals
- Bulk order handling
- Review moderation
- Analytics dashboard

### 🤖 AI Features
- AI-powered chatbot (Google Gemini)
- Order-aware responses
- Product recommendations

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Payments**: Razorpay
- **AI**: Google Gemini API
- **Async**: Motor (async MongoDB driver)

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Hooks
- **Routing**: React Router v7
- **Animations**: Framer Motion, GSAP
- **Forms**: React Hook Form + Zod

---

## 🚀 Quick Deployment

### Prerequisites
- MongoDB Atlas account (free tier)
- Render account (for backend)
- Vercel account (for frontend)

### Deploy in 5 Minutes
Follow the detailed guide: **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)**

**TL;DR:**
1. Deploy backend on Render (`backend/` directory)
2. Deploy frontend on Vercel (`frontend/` directory)
3. Add environment variables
4. Done! 🎉

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) | 5-minute deployment guide (Hindi + English) |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Detailed step-by-step deployment |
| [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) | Pre-flight checks before deploying |

---

## 🔧 Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python test_mongodb_connection.py  # Test Atlas connection
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

### Create Admin User
```bash
cd backend
python create_admin.py
```

**Default Admin Credentials:**
- Email: `admin@mithaas.com`
- Password: `admin123`

---

## 🌍 Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb+srv://...
DB_NAME=mithaas_delights_production
CORS_ORIGINS=*
GEMINI_API_KEY=your_key
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
WHATSAPP_NUMBER=+91...
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
```

---

## 📦 Project Structure

```
mithaas-delights/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── auth_utils.py          # JWT authentication
│   ├── delivery_utils.py      # Delivery calculations
│   ├── razorpay_utils.py      # Payment integration
│   ├── enhanced_chatbot.py    # AI chatbot
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main React component
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   └── utils/             # Helper functions
│   ├── package.json           # Node dependencies
│   └── .env                   # Environment variables
│
├── QUICK_DEPLOY.md            # Quick deployment guide
├── DEPLOYMENT_GUIDE.md        # Detailed deployment guide
└── README.md                  # This file
```

---

## 🎯 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/products` - List products
- `GET /api/categories` - List categories
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (User)
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add to cart
- `POST /api/orders` - Create order
- `GET /api/orders/my` - My orders

### Admin Endpoints
- `POST /api/products` - Create product
- `POST /api/categories` - Create category
- `POST /api/coupons` - Create coupon
- `POST /api/banners` - Create banner

---

## 🔐 Security

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Environment variables for secrets
- ✅ Input validation (Pydantic)
- ⚠️ Update Razorpay keys for production
- ⚠️ Change default admin password

---

## 📱 Features Breakdown

### Product Management
- Multiple variants per product (weight-based)
- Image galleries (multiple images per product)
- Inventory tracking
- Featured products
- Category-based organization

### Order Management
- Order status tracking (Pending → Confirmed → Preparing → Delivered)
- WhatsApp integration for order confirmation
- Delivery charge calculation based on distance
- Advance payment for large orders

### Coupon System
- Percentage discounts
- Flat discounts
- BOGO (Buy X Get Y)
- Category-specific coupons
- Free shipping coupons
- Usage limits (total & per-user)

---

## 🧪 Testing

### Test MongoDB Connection
```bash
cd backend
python test_mongodb_connection.py
```

### Test Backend Health
```bash
curl https://your-backend-url.onrender.com/api/health
```

### Test Admin Login
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"**********","password":"**********"}'
```

---

## 🎨 UI Components

Built with **Radix UI** + **Tailwind CSS**:
- Accordion, Alert Dialog, Avatar
- Button, Card, Carousel
- Dialog, Dropdown Menu
- Form components (Input, Select, Checkbox)
- Toast notifications
- Tabs, Tooltips
- And more...

---

## 📈 Roadmap

- [ ] Add payment gateway (Razorpay live mode)
- [ ] SMS notifications
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Loyalty points system
- [ ] Subscription boxes

---

## 🐛 Troubleshooting

### Backend won't start?
- Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)
- Verify environment variables
- Check Render logs

### Frontend can't connect to backend?
- Verify `REACT_APP_BACKEND_URL` in Vercel
- Check backend CORS settings
- Ensure backend is running

### MongoDB connection errors?
- Run `test_mongodb_connection.py`
- Check Atlas cluster status
- Verify credentials

---

## 📞 Support

For deployment issues, refer to:
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md)

---

## 📄 License

This project is private. All rights reserved.

---

## 🙏 Acknowledgments

- Built with FastAPI and React
- UI components from Radix UI
- Icons from Lucide React
- Animations with Framer Motion
- Database: MongoDB Atlas
- Deployment: Render + Vercel

---

**Made with ❤️ for Indian Sweet Shops**

🍬 Happy Selling! 🎉

