# Keshav Admin Panel

A comprehensive React-based admin panel for managing inventory, products, vendors, and settings.

## Features

### 📊 Dashboard
- Total inventory metrics
- Sales charts with date range filters
- Product sales analytics
- Best pickup locations leaderboard
- Best selling products
- Low inventory alerts for pickup locations and main warehouse

### ⚙️ Settings
- **Category Management**: Add, edit, delete, and search categories
- **Vendor Management**: View all vendors with filtering and status toggle
- **Change Password**: Secure password update with strength indicator

### 📦 Inventory Management
- Add new inventory with SKU details
- Category and subcategory selection
- Vendor assignment
- Update inventory quantities
- Inventory list with search and filtering
- Low stock alerts

### 🛍️ Product Management
- Add new products with images
- Create combo products with automatic savings calculation
- Product list with advanced filtering
- Mark products out of stock
- Product search and categorization

### 👥 Vendor Management
- Add new vendors with complete details
- Address and pickup location assignment
- Financial details (GST, PAN, Bank)
- Document uploads
- Vendor list with search and filters
- View detailed vendor profiles

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Navigation
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Recharts** - Charts and graphs
- **Lucide React** - Icons
- **Vite** - Build tool

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

### Login
- Default login: Use any email and password (authentication is simulated)
- After login, you'll be redirected to the dashboard

### Navigation
- Use the sidebar to navigate between different sections
- Dashboard - Overview and metrics
- Inventory - Manage inventory items
- Products - Manage products and combos
- Vendors - Manage vendor accounts
- Settings - System settings and configurations

## Form Validations

All forms include comprehensive validation:
- **Email**: Must contain @ and valid domain
- **Phone**: Exactly 10 digits
- **Password**: Min 8 chars, 1 uppercase, 1 number, 1 special char
- **GST**: 15 alphanumeric characters
- **PAN**: Format: AAAAA1234A
- **IFSC**: Format: AAAA0A1234
- **PIN**: Exactly 6 digits
- **File Uploads**: Max 5MB per file
- **Required Fields**: Marked with red asterisk (*)

## Project Structure

```
src/
├── components/
│   ├── Form/          # Reusable form components
│   └── Layout/        # Layout components (Sidebar, Header)
├── pages/
│   ├── Dashboard.jsx
│   ├── Settings.jsx
│   ├── AddInventory.jsx
│   ├── ProductManagement.jsx
│   ├── VendorManagement.jsx
│   └── Login.jsx
├── utils/
│   ├── validation.js  # Validation utilities
│   └── helpers.js      # Helper functions
├── App.jsx
├── main.jsx
└── index.css
```

## Notes

- All data is stored in component state (mock data)
- In production, connect to a backend API
- File uploads are simulated (not actually saved)
- Authentication is simplified (use localStorage)
- Charts use mock data - replace with real API calls

## Future Enhancements

- Backend API integration
- Real-time notifications
- Export to Excel functionality
- Advanced analytics
- User roles and permissions
- Activity logging
- Email notifications

