# Smart Inventory Management System

A production-ready SaaS inventory management system with a built-in Point of Sale (POS) and customer self-ordering system. Built with FastAPI, React, and PostgreSQL.

---

## Features

### Staff / Admin Side
- **Role-based access control** — Admin, Manager, Staff
- **Product management** — Add, edit, delete products with SKU, category, supplier, expiry date
- **Stock tracking** — Full audit trail of every stock movement (in / out / adjustment)
- **Barcode scanning** — Scan product barcodes to look up or pre-fill products
- **Low stock alerts** — Automatic alerts when stock falls below reorder level
- **Expiry tracking** — Track and flag products expiring soon or already expired
- **AI demand forecasting** — Weighted moving average forecast with trend detection
- **Profit & analytics** — Margin %, profit potential, revenue realized per product
- **Export** — Download inventory and stock movements as Excel or PDF
- **Supplier & category management**
- **User management** — Admin can create, activate, deactivate users
- **Activity log** — Full audit trail of all staff actions
- **Live orders dashboard** — View, manage, and update incoming customer orders
- **POS billing mode** — Staff can bill customers directly from a fast POS screen
- **Table QR code generator** — Generate and print QR codes for each table

### Customer Side (Public, No Login Required)
- **Self-service menu** — Customers scan a QR code and browse available products
- **Cart & checkout** — Add items, adjust quantities, view total
- **UPI payment** — QR code generated for GPay / PhonePe / Paytm
- **Cash option** — Place order and pay at counter
- **Auto stock deduction** — Stock updates instantly when an order is placed
- **Order confirmation** — Receipt shown after successful order

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 18, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt |
| Frontend | React.js, Tailwind CSS |
| Charts | Recharts |
| Barcode | @ericblade/quagga2 |
| Exports | openpyxl, reportlab |
| Forecasting | NumPy |

---

## Project Structure

```
smart-inventory/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Auth, dependencies
│   │   ├── main.py
│   │   ├── config.py
│   │   └── database.py
│   ├── .env
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/      # Layout, BarcodeScanner
    │   ├── pages/           # All page components
    │   ├── services/        # API service functions
    │   ├── context/         # AuthContext
    │   └── utils/           # downloadFile helper
    └── package.json
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 18

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/smart-inventory.git
cd smart-inventory
```

### 2. Backend setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smart_inventory
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Create the database in PostgreSQL:
```sql
CREATE DATABASE smart_inventory;
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Tables are created automatically on first run.

### 3. Frontend setup
```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

### 4. First login

Register an admin account at `http://localhost:3000` and select the Admin role.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/products/` | List products (search, filter) |
| POST | `/api/products/` | Create product |
| GET | `/api/products/low-stock` | Products below reorder level |
| GET | `/api/products/expiring-soon` | Products expiring within N days |
| POST | `/api/stock/in` | Record stock in |
| POST | `/api/stock/out` | Record stock out |
| POST | `/api/stock/adjust` | Adjust stock level |
| GET | `/api/analytics/dashboard` | Dashboard KPIs |
| GET | `/api/analytics/forecast` | AI demand forecast |
| GET | `/api/analytics/profit-analysis` | Profit margins per product |
| GET | `/api/orders/public/products` | Public product menu (no auth) |
| POST | `/api/orders/public/place` | Place customer order (no auth) |
| POST | `/api/orders/staff/place` | Place order as staff |
| GET | `/api/orders/` | List all orders |
| PUT | `/api/orders/{id}/status` | Update order status |
| GET | `/api/exports/products/excel` | Export inventory as Excel |
| GET | `/api/exports/products/pdf` | Export inventory as PDF |

Full interactive docs: `http://127.0.0.1:8000/docs`

---

## Role Permissions

| Feature | Admin | Manager | Staff |
|---|---|---|---|
| View products | ✅ | ✅ | ✅ |
| Add / edit products | ✅ | ✅ | ❌ |
| Delete products | ✅ | ❌ | ❌ |
| Stock movements | ✅ | ✅ | ✅ |
| Analytics & forecasting | ✅ | ✅ | ❌ |
| Manage suppliers / categories | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View activity log | ✅ | ✅ | ❌ |
| POS billing | ✅ | ✅ | ✅ |
| Orders dashboard | ✅ | ✅ | ✅ |
| Table QR generator | ✅ | ✅ | ❌ |

---

## Customer Self-Service Flow

1. Staff generates QR codes from the **Table QR Codes** page
2. QR codes are printed and placed on tables
3. Customer scans QR → opens `/menu?table=Table 1`
4. Customer browses products, adds to cart
5. Customer selects UPI or Cash at checkout
6. If UPI → QR code shown for payment → customer confirms
7. If Cash → order placed, customer pays staff
8. Stock is deducted automatically
9. Order appears live in the **Orders** dashboard
10. Staff marks order as Paid / Completed

---

## Deployment

### Update before deploying
1. In `CustomerMenu.js` — replace `const UPI_ID = "yourname@upi"` with the client's real UPI ID
2. In `TableQR.js` — replace `const BASE_URL = 'http://localhost:3000'` with the deployed domain
3. In `backend/.env` — set a strong `SECRET_KEY`
4. In `backend/main.py` — restrict CORS to your deployed frontend domain

### Recommended platforms
- **Backend**: Render (free tier), Railway, or DigitalOcean
- **Frontend**: Vercel or Netlify (free)
- **Database**: Render PostgreSQL, Railway, or Supabase (free tiers available)

---

## License

MIT License — free to use, modify, and sell to clients.

---

*Built with FastAPI + React + PostgreSQL*