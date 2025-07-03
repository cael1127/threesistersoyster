# Backend Database Setup Guide

This guide will help you set up the Three Sisters Oyster backend with MongoDB to replace local storage and enable multi-user data synchronization.

## 🗄️ Overview

The backend now uses MongoDB to store:
- **Products** - Items available for purchase
- **Inventory** - Nursery and farm inventory items
- **Orders** - Customer orders and payment information
- **Statistics** - Real-time inventory counts

## 📋 Prerequisites

1. **MongoDB Atlas Account** (Recommended for production)
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster

2. **Vercel Account** (For deployment)
   - Your existing Vercel account

## 🚀 Setup Steps

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Set Up MongoDB

#### Option A: MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas Cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free account
   - Create a new cluster (M0 Free tier is sufficient)
   - Choose your preferred cloud provider and region

2. **Configure Database Access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

3. **Configure Network Access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for Vercel deployment)
   - Click "Confirm"

4. **Get Connection String:**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `threesistersoyster`

#### Option B: Local MongoDB (Development)

```bash
# Install MongoDB locally
# macOS with Homebrew:
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Connection string will be:
mongodb://localhost:27017/threesistersoyster
```

### Step 3: Configure Environment Variables

1. **Create `.env` file in the backend directory:**

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=orders@threesistersoyster.com
ADMIN_EMAIL=your-email@threesistersoyster.com

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/threesistersoyster

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000
```

2. **Replace the MongoDB URI with your actual connection string**

### Step 4: Test Local Backend

```bash
cd backend
npm start
```

You should see:
```
🚀 Three Sisters Oyster backend server running on port 3000
✅ Connected to MongoDB
✅ Default products initialized
✅ Default inventory initialized
📧 Email notifications will be sent to: your-email@threesistersoyster.com
🔒 Environment: development
🌐 Health check: http://localhost:3000/health
```

### Step 5: Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy from backend directory:**
```bash
cd backend
vercel
```

3. **Set Environment Variables in Vercel:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to "Settings" → "Environment Variables"
   - Add all variables from your `.env` file

4. **Update Mobile App API URL:**
   - In `services/apiService.ts`, update `API_BASE_URL` to your Vercel deployment URL

## 🔧 API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create/update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:type` - Get inventory by type (nursery/farm)
- `POST /api/inventory` - Create/update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `POST /api/inventory/update-after-purchase` - Update inventory after purchase
- `POST /api/inventory/check-stock` - Check stock availability

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

### Statistics
- `GET /api/statistics/inventory` - Get inventory statistics for home screen

## 🔄 Data Migration

The backend automatically initializes default data when first connected to an empty database:

### Default Products
- Pacific Oysters (Bulk - 100 count) - $120
- Kumamoto Oysters (Bulk - 100 count) - $180
- Blue Pool Oysters (Bulk - 100 count) - $150
- Three Sisters Oyster T-Shirt - $25
- Oyster Shucking Knife - $35
- Three Sisters Cap - $20

### Default Inventory
- **Nursery Items:** Pacific, Kumamoto, Blue Pool, Virginica oysters
- **Farm Items:** Pacific, Kumamoto, Blue Pool, Virginica, Olympia, Shigoku oysters

## 🧪 Testing

1. **Test Health Check:**
```bash
curl https://your-vercel-url.vercel.app/health
```

2. **Test Products API:**
```bash
curl https://your-vercel-url.vercel.app/api/products
```

3. **Test Inventory API:**
```bash
curl https://your-vercel-url.vercel.app/api/inventory
```

## 🔒 Security Considerations

1. **Environment Variables:** Never commit `.env` files to version control
2. **MongoDB Access:** Use strong passwords and limit network access
3. **CORS:** Configure allowed origins properly for production
4. **Rate Limiting:** Already implemented in the backend

## 🚨 Troubleshooting

### MongoDB Connection Issues
- Check your connection string format
- Verify username/password are correct
- Ensure network access is configured properly
- Check if MongoDB Atlas cluster is active

### Vercel Deployment Issues
- Verify all environment variables are set in Vercel
- Check Vercel function logs for errors
- Ensure MongoDB URI is accessible from Vercel

### Mobile App Issues
- Verify API_BASE_URL is correct
- Check network connectivity
- Review console logs for API errors

## 📱 Mobile App Updates

The mobile app has been updated to use the API instead of local storage:

1. **New API Service:** `services/apiService.ts`
2. **Updated Services:** All services now use the API
3. **Real-time Updates:** Multiple users see the same data
4. **Offline Fallback:** App gracefully handles API failures

## 🎉 Benefits

- **Multi-user Support:** All users see the same data
- **Real-time Updates:** Changes appear instantly across devices
- **Data Persistence:** No data loss when app is uninstalled
- **Scalability:** Can handle multiple users and large datasets
- **Backup & Recovery:** MongoDB provides automatic backups
- **Analytics:** Can track usage patterns and performance

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test API endpoints individually
4. Check MongoDB Atlas dashboard for connection issues 