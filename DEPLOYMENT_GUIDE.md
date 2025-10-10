# 🚀 Mithaas Delights Deployment Guide

## ✅ Prerequisites Done
- ✅ MongoDB Atlas cluster created (Cluster0)
- ✅ Backend .env updated with Atlas URI
- ✅ requirements.txt cleaned (removed duplicates)
- ✅ Database name set to `mithaas_delights_production`

---

## 📦 Part 1: Backend Deployment on Render

### Step 1: Go to Render Dashboard
1. Visit: https://dashboard.render.com/
2. Click "New +" button
3. Select **"Web Service"**

### Step 2: Connect Repository
**Public Git Repository URL:**
```
https://github.com/MOHITVYASJI/Mithaas-Delights-Update.git
```

### Step 3: Configure Web Service
Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `mithaas-backend` (ya koi bhi naam) |
| **Region** | Select closest to you |
| **Branch** | `main` (or `master`) |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### Step 4: Environment Variables
Click "Advanced" and add these environment variables:

```
MONGO_URL=mongodb+srv://MohitVyas:2225119@cluster0.xc3jq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=mithaas_delights_production
CORS_ORIGINS=*
GEMINI_API_KEY=AIzaSyCYE19IWpjXf-q2I89tjx9QlbI4iwZr6D8
JWT_SECRET=mithaas-delights-secret-key-2024-super-secure-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_key_1234567890
WHATSAPP_NUMBER=+918989549544
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (example: `https://mithaas-backend.onrender.com`)

---

## 🎨 Part 2: Frontend Deployment on Vercel

### Step 1: Update Frontend .env
Before deploying, update `/app/mithaas-project/frontend/.env`:

```env
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
```

**Replace with your actual Render backend URL!**

### Step 2: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)
1. Visit: https://vercel.com/new
2. Click "Import Project"
3. Enter repository URL:
   ```
   https://github.com/MOHITVYASJI/Mithaas-Delights-Update.git
   ```
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`
   
5. Add Environment Variable:
   - Key: `REACT_APP_BACKEND_URL`
   - Value: `https://your-backend-url.onrender.com` (from Render)

6. Click **"Deploy"**

#### Option B: Using Vercel CLI
```bash
npm i -g vercel
cd /app/mithaas-project/frontend
vercel --prod
```

---

## 🧪 Testing Deployment

### Test Backend
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Get products
curl https://your-backend-url.onrender.com/api/products

# Get categories
curl https://your-backend-url.onrender.com/api/categories
```

### Test Frontend
1. Open your Vercel URL in browser
2. Check if website loads properly
3. Try browsing products (will be empty initially)

---

## 📝 Post-Deployment Tasks

### 1. Create Admin User
You'll need to create an admin user to add products. Use this script:

```python
# Create file: create_admin.py in backend folder
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth_utils import get_password_hash
import uuid
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient("mongodb+srv://MohitVyas:2225119@cluster0.xc3jq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client["mithaas_delights_production"]
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@mithaas.com",
        "hashed_password": get_password_hash("admin123"),
        "role": "admin",
        "phone": "+918989549544",
        "addresses": [],
        "wishlist": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Admin user created!")
    print("Email: admin@mithaas.com")
    print("Password: admin123")

asyncio.run(create_admin())
```

Run: `python create_admin.py`

### 2. Add Products via Admin Panel
1. Login with admin credentials
2. Navigate to admin dashboard
3. Add categories and products

---

## 🔧 Troubleshooting

### Backend Not Starting?
- Check Render logs for errors
- Verify all environment variables are set
- Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)

### Frontend Can't Connect to Backend?
- Verify `REACT_APP_BACKEND_URL` is correct
- Check CORS settings in backend
- Ensure backend is running (check Render dashboard)

### MongoDB Connection Error?
- Go to MongoDB Atlas → Network Access
- Click "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)

---

## 📞 Support

If you face any issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Vercel logs: Dashboard → Your Project → Deployments → View Logs
3. Test MongoDB connection from Atlas dashboard

---

## ✨ Next Steps After Deployment

1. ✅ Create admin account
2. ✅ Add product categories
3. ✅ Add products with images
4. ✅ Test ordering flow
5. ✅ Update Razorpay keys (currently test keys)
6. ✅ Add custom domain (optional)

**Good luck with your deployment! 🎉**