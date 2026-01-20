# HANK E-Commerce Platform

## Overview

HANK is a Turkish fitness and bodybuilding e-commerce platform built as a full-stack web application. The platform enables customers to browse products, manage shopping carts, and complete purchases, while providing administrators with a dashboard to manage products, categories, and orders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React Context for auth and cart state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for UI animations
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with:
- Reusable UI components in `client/src/components/ui/`
- Feature components in `client/src/components/`
- Custom hooks for auth (`useAuth`), cart (`useCart`), and products (`useProducts`)
- Pages organized in `client/src/pages/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Authentication**: JWT with HttpOnly cookies and refresh tokens
- **Password Hashing**: bcrypt for secure password storage
- **Build**: esbuild for production bundling

The server uses a layered architecture:
- `server/routes.ts` - API endpoint definitions and middleware
- `server/storage.ts` - Data access layer abstracting database operations
- `server/db.ts` - Database connection setup
- `server/static.ts` - Static file serving for production

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using Drizzle's schema builder
- **Validation**: Zod schemas generated from Drizzle schemas via drizzle-zod
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

Database tables include:
- `admin_users` - Admin authentication
- `users` - Customer accounts
- `categories` - Product categories
- `products` - Product catalog
- `product_variants` - Size/color variants with stock
- `cart_items` - Shopping cart persistence
- `orders` and `order_items` - Order management

### Authentication (JWT-based, Fully Stateless)
- **Architecture**: Stateless JWT + HttpOnly Cookie + Refresh Token Rotation (no express-session)
- **Access Tokens**: Short-lived (15 minutes), stored in HttpOnly cookie
- **Refresh Tokens**: Long-lived (7 days), stored in HttpOnly cookie with database tracking
- **Token Refresh**: Automatic refresh when access token expires via `getAuthPayload` helper
- **Token Rotation**: Refresh tokens are rotated on every use - old tokens are revoked immediately
- **Token Revocation**: Individual token or all tokens per user via database
- **Security**: IP address and user agent tracking for refresh tokens
- **Cart Tokens**: Anonymous shopping carts use `cart_token` HttpOnly cookie (30-day expiry)
- **Admin Auth**: JWT-based authentication via `/api/admin/login`
- **Customer Auth**: JWT-based authentication via `/api/auth/*` endpoints
- **Production**: Secure cookies with SameSite=Strict in production mode
- **JWT Module**: `server/jwt.ts` contains all JWT utilities including cart token helpers
- Admin panel accessible at `/toov-admin`

### API Structure
RESTful API endpoints under `/api/`:
- `/api/admin/*` - Admin authentication and management
- `/api/auth/*` - Customer authentication
- `/api/products` - Product listing with filters
- `/api/categories` - Category management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order creation and management
- `/api/admin/influencer-coupons` - Influencer tracking and commission management
- `/api/admin/settings` - Database-stored SMTP and site settings

### Marketing & Influencer System
- **Influencer Tracking**: Influencers are managed via coupons with `isInfluencerCode=true`
- **Commission Types**: 
  - `percentage` - Percentage of order total per use
  - `per_use` - Fixed amount per code usage
  - `fixed_total` - One-time fixed payment
- **Commission Tracking**: `totalCommissionEarned` tracks accumulated earnings
- **Payment Status**: `commissionPaid` flag marks when influencer has been paid
- **Instagram Integration**: `influencerInstagram` links to influencer's profile

### Stock Management
- **Automatic Stock Reduction**: Orders automatically reduce variant stock on creation
- **Stock Adjustments**: Logged with types: 'sale', 'return', 'manual', 'restock', 'correction'
- **Order Cancellation**: Automatically restores stock when orders are cancelled
- **Low Stock Alerts**: Admin dashboard highlights low stock variants

### Product/Variant Consistency (Critical Fix)
- When processing cart items with variants, always use variant's `productId` to fetch product details
- This prevents product name mismatch in invoices (e.g., pants showing as t-shirt)
- Applied to: payment creation, order creation, and abandoned cart emails

### Email Notifications
- **SMTP Configuration**: Stored in database via `settings` table (not .env)
- **Configured SMTP**: host=mail.toov.com.tr, user=no-reply@toov.com.tr
- **Email Templates**: Dark athletic luxury theme matching brand identity
- **Free Shipping Threshold**: 2500 TL

### Payment System (PayTR)
- **Production Domain**: hank.com.tr
- **Callback URL**: https://hank.com.tr/api/payment/callback
- **Success URL**: https://hank.com.tr/odeme-basarili
- **Fail URL**: https://hank.com.tr/odeme-basarisiz
- **Payment Mode**: Credit card only (taksit disabled)

### BizimHesap Invoice Integration
- **API Endpoint**: https://bizimhesap.com/api/b2b/addinvoice
- **Invoice Type**: 3 (Satış Faturası)
- **KDV Rate**: %20 (prices are KDV inclusive)
- **Auto-trigger**: Invoices are automatically sent after successful PayTR payment
- **No discounts shown**: Total amount sent directly without discount breakdown
- **Currency**: TL

### B2B Dealer Management System
- **Dealer Management**: Full CRUD for dealer companies (name, contact person, email, phone, address)
- **Dealer Status**: Active/Inactive status tracking
- **Quote System**: Professional quote creation with product selection
- **Quote Numbering**: Format `TKL-{year}-{sequential}` (e.g., TKL-2026-001)
- **Quote Status Workflow**: draft → sent → accepted/rejected/expired
- **Payment Terms**: cash, net15, net30, net45, net60
- **Line Items**: Products with quantity, unit price, discount percentage
- **Quote Validity**: Optional expiration date for quotes
- **Admin Tabs**: "Bayiler" for dealers, "Teklifler" for quotes in admin dashboard
- **API Routes**: `/api/admin/dealers/*`, `/api/admin/quotes/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### Third-Party Libraries
- **shadcn/ui + Radix UI**: Accessible UI component primitives
- **TanStack React Query**: Data fetching and caching
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **Sharp**: Image optimization and processing

### Image Optimization
- All product and category images are automatically optimized on upload
- Converts images to WebP format for better compression
- Resizes large images (max 1200x1200) while maintaining aspect ratio
- Compresses with 85% quality for optimal file size vs quality balance
- Works for both manual uploads and WooCommerce sync imports
- Utility located at `server/imageOptimizer.ts`

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Express session secret (defaults to development value)
- `NODE_ENV` - Environment mode (development/production)

### Replit-Specific Integrations
- Vite plugins for Replit development environment
- Meta images plugin for OpenGraph image handling
- Runtime error overlay for development debugging