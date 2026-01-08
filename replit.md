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
- **Session Management**: express-session for user sessions
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

### Authentication
- **Admin Auth**: Session-based authentication via `/api/admin/login`
- **Customer Auth**: Session-based authentication via `/api/auth/*` endpoints
- **Session Storage**: Server-side sessions with configurable secret
- Admin panel accessible at `/toov-admin`

### API Structure
RESTful API endpoints under `/api/`:
- `/api/admin/*` - Admin authentication and management
- `/api/auth/*` - Customer authentication
- `/api/products` - Product listing with filters
- `/api/categories` - Category management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order creation and management

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### Third-Party Libraries
- **shadcn/ui + Radix UI**: Accessible UI component primitives
- **TanStack React Query**: Data fetching and caching
- **Framer Motion**: Animation library
- **Lucide React**: Icon library

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Express session secret (defaults to development value)
- `NODE_ENV` - Environment mode (development/production)

### Replit-Specific Integrations
- Vite plugins for Replit development environment
- Meta images plugin for OpenGraph image handling
- Runtime error overlay for development debugging