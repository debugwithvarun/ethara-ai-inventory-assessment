# 📦 InventoryPro — Inventory & Order Management System

A full-stack inventory and order management system for managing products, customers, and orders with real-time inventory tracking, automatic stock validation, and a modern admin dashboard.

---

## 🔗 Live URLs

| Service | URL |
|---------|-----|
| 🌐 Frontend (Vercel) | `https://your-app.vercel.app` |
| ⚙️ Backend API (Render) | `https://your-api.onrender.com` |

> Update the above after deployment.

---

## 🔑 Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@example.com` |
| Password | `Admin@123` |

> These are created automatically when you run `python seed.py`.  
> **Change the password immediately after first login in production.**

---

## ✨ Features

### 🔐 Authentication
- JWT-based admin login
- Secure password hashing with bcrypt
- Auto-redirect to login on token expiry
- Session persistence via localStorage

### 📦 Products
- Create, view, update, delete products
- **Automatic SKU generation** (`CATEGORY-XXXXXX` format, DB-verified unique)
- Custom SKU support
- Category management
- Low stock threshold alerts (visual badges)
- Prevent deletion of products in active orders

### 👥 Customers
- Full CRUD for customer records
- **Unique email enforcement**
- Order history count per customer
- Prevent deletion of customers with existing orders

### 🛒 Orders
- **3-step creation wizard**: Select Customer → Add Products → Review & Submit
- **Real-time inventory validation** before order creation
- **Atomic stock deduction** using database row-level locks
- Full order cancellation with automatic **stock restoration**
- Status workflow: `pending → processing → fulfilled` (or `cancelled`)
- Detailed order view with all line items

### 📊 Dashboard
- Total Revenue, Orders, Products, Customers KPI cards
- Revenue trend chart (last 30 days, fulfilled orders only)
- Orders by status donut chart
- Low stock alerts panel
- Recent orders table
- Top 5 selling products ranking

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Flask 3.0 | Web framework |
| Flask-SQLAlchemy | ORM |
| Flask-Migrate | Database migrations |
| Flask-JWT-Extended | JWT authentication |
| Flask-Bcrypt | Password hashing |
| Flask-CORS | Cross-origin requests |
| Marshmallow | Serialization |
| PostgreSQL | Database |
| Gunicorn | Production WSGI server |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| React Router DOM | Client-side routing |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |
| Recharts | Charts |
| Lucide React | Icons |
| date-fns | Date formatting |

---

## 📂 Project Structure

```
ethara_varun_assesmnet/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Environment configs
│   │   ├── extensions.py        # Flask extensions
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── customer.py
│   │   │   └── order.py         # Order + OrderItem
│   │   ├── blueprints/          # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── customers.py
│   │   │   ├── orders.py
│   │   │   └── dashboard.py
│   │   └── utils/
│   │       ├── sku_generator.py
│   │       └── order_number.py
│   ├── seed.py                  # Database seeder
│   ├── run.py                   # Dev server entry
│   ├── requirements.txt
│   └── Procfile                 # Render deployment
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API modules
│   │   ├── components/          # Layout, Sidebar, ProtectedRoute
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # Login, Dashboard, Products, Customers, Orders
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vercel.json
│
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (installed locally)

---

### PostgreSQL Setup

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create the database:

```sql
CREATE DATABASE inventory_db;
```

---

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your .env file
copy .env.example .env     # Windows
# cp .env.example .env     # macOS/Linux

# 4. Edit .env with your DB credentials:
#    DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/inventory_db
#    SECRET_KEY=any-random-string
#    JWT_SECRET_KEY=another-random-string

# 5. Run database migrations
flask --app run db init
flask --app run db migrate -m "initial migration"
flask --app run db upgrade

# 6. Seed default admin + sample data
python seed.py

# 7. Start the development server
python run.py
```

✅ Backend runs at: **http://localhost:5000**

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env file
copy .env.example .env     # Windows
# cp .env.example .env     # macOS/Linux

# Contents of .env:
# VITE_API_URL=http://localhost:5000

# 3. Start development server
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

## 🌐 API Reference

### Base URL
- Local: `http://localhost:5000`
- Production: `https://your-api.onrender.com`

### Authentication
All endpoints except `/api/auth/login` and `/api/auth/register` require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register admin user |
| POST | `/api/auth/login` | Login (returns a JWT) |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/auth/logout` | Logout |

**Login request:**
```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

**Login response:**
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

---

### Products Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products?page=1&per_page=20&search=mouse&category=Electronics&low_stock_only=true` | List products |
| POST | `/api/products` | Create product (auto-generates SKU) |
| GET | `/api/products/:id` | Get single product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/categories/list` | List distinct categories |

**Create product:**
```json
{
  "name": "Wireless Mouse",
  "price": 29.99,
  "stock_quantity": 150,
  "category": "Electronics",
  "description": "Ergonomic wireless mouse",
  "low_stock_threshold": 10
}
```

---

### Customers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers?page=1&search=alice` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id?include_orders=true` | Get customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

---

### Orders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders?status=pending&search=ORD` | List orders |
| POST | `/api/orders` | Create order (validates inventory and deducts stock) |
| GET | `/api/orders/:id` | Get order with items |
| PUT | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Cancel order and restore stock |

**Create order request:**
```json
{
  "customer_id": "uuid-here",
  "items": [
    { "product_id": "uuid-here", "quantity": 2 },
    { "product_id": "uuid-here", "quantity": 1 }
  ],
  "notes": "Rush delivery"
}
```

**Insufficient stock error (422):**
```json
{
  "error": "Insufficient stock for one or more products",
  "insufficient_items": [
    {
      "product_name": "Wireless Mouse",
      "sku": "ELEC-A3B9K2",
      "requested": 5,
      "available": 2
    }
  ]
}
```

---

### Dashboard Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | All dashboard statistics |

---

## 🔒 Business Rules

| Rule | Implementation |
|------|---------------|
| Unique SKUs | Auto-generated with DB uniqueness check; custom SKU allowed |
| Unique customer emails | Enforced at DB level + API validation |
| Inventory validation | Row-level lock (`SELECT ... FOR UPDATE`) before deduction |
| Atomic order creation | Full DB transaction — rolls back everything on any failure |
| Stock deduction | Applied immediately on successful order creation |
| Stock restoration | Triggered automatically on order cancellation |
| Deletion guards | Products in active orders cannot be deleted; customers with orders cannot be deleted |

---

## ☁️ Deployment

### Backend → Render.com (Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo, set root directory to `backend/`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `gunicorn "app:create_app('production')" --bind 0.0.0.0:$PORT`
6. Add a **PostgreSQL database** on Render (free tier) → copy the connection string
7. Set environment variables in the Render dashboard:
   ```
   FLASK_ENV=production
   DATABASE_URL=<paste Render PostgreSQL URL>
   SECRET_KEY=<generate a strong random string>
   JWT_SECRET_KEY=<generate another random string>
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```
8. After first deploy, open Render Shell and run:
   ```bash
   flask --app run db upgrade
   python seed.py
   ```

---

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo, set **Root Directory** to `frontend/`
3. Framework preset: **Vite**
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
5. Click **Deploy** ✅

---

## 🛠️ Environment Variables

### Backend `.env`
```env
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
CORS_ORIGINS=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000
```

---

## 🌱 Seed Data

Running `python seed.py` creates:

**Admin user:**
- Email: `admin@example.com`
- Password: `Admin@123`

**8 Sample Products** across Electronics, Office, Stationery, Furniture categories

**5 Sample Customers** with contact info and addresses

---

## 📸 Application Pages

| Page | What You Can Do |
|------|----------------|
| **Login** | Default credentials shown with one-click copy & auto-fill button |
| **Dashboard** | KPI cards, revenue chart, orders pie, low-stock alerts, top products |
| **Products** | Search, add, edit, delete. Auto-generated SKU. Low/out-of-stock badges |
| **Customers** | Search, add, edit, delete. View order count per customer |
| **Orders** | Create with 3-step wizard, filter by status, view details, cancel with stock restore |



## 📄 License

Varun Chauhan
vc28022004@gmail.com
