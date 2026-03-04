# HANK E-Commerce Platform

## Overview
HANK is a full-stack e-commerce platform specializing in fitness and bodybuilding products for the Turkish market. It allows customers to browse products, manage carts, and make purchases, while providing administrators with tools for product, category, and order management. The platform aims to capture market share in the fitness e-commerce sector through a robust feature set and a strong brand identity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, React Context for local state, Tailwind CSS with shadcn/ui (New York style), Framer Motion for animations, Vite for building.
- **Backend**: Node.js with Express, TypeScript, JWT for authentication (stateless with HttpOnly cookies and refresh token rotation), bcrypt for password hashing, esbuild for bundling.
- **Database**: PostgreSQL with Drizzle ORM for schema management and queries, Drizzle Kit for migrations.
- **UI/UX**: Component-based architecture with reusable UI elements, consistent styling, and animations. Admin panel accessible at `/toov-admin`.

### Key Features
- **Authentication**: JWT-based for both customers and administrators, featuring refresh token rotation and HttpOnly cookies for enhanced security.
- **Multi-Category Product Support**: Products can be assigned to multiple categories, enhancing discoverability.
- **Stock Management**: Automatic stock reduction on orders, stock adjustments, and restoration on cancellation.
- **AI Product Description Generation**: Integration with OpenAI GPT-4o for generating product descriptions in various styles, including HTML formatting.
- **Payment System**: Integration with PayTR for credit card payments, handling callbacks and success/failure redirects.
- **Invoice Integration**: Automatic invoice generation and submission to BizimHesap after successful payments.
- **Coupon System**: Flexible coupon management with percentage/fixed discounts, usage limits, and validity periods.
- **Shipping & International Orders**: Differentiated shipping costs for domestic and international orders with server-side validation.
- **Email Notifications**: Database-configurable SMTP for sending emails using brand-aligned templates.
- **B2B Dealer Management & Quote System**: Comprehensive system for managing dealer companies and generating professional quotes with stock deduction upon acceptance.
- **Meta Pixel + CAPI Integration**: Server-side and client-side tracking of key e-commerce events (PageView, ViewContent, AddToCart, Purchase, etc.) with robust user data matching for Facebook advertising.
- **Google Merchant Center Feed**: Automated XML product feed generation for Google Shopping.
- **AI Chatbot (Ürün Asistanı)**: Conversational AI for product search, recommendations, and availability checks, utilizing product embeddings for semantic search.

## External Dependencies

### Database
- **PostgreSQL**: Main data store.

### Third-Party Services & APIs
- **OpenAI**: For AI product description generation and chatbot functionality.
- **PayTR**: Payment gateway for processing credit card transactions.
- **BizimHesap**: Accounting software for invoice integration.
- **Facebook (Meta Pixel/CAPI)**: For advertising and event tracking.
- **Google Merchant Center**: For product feed submission.

### Libraries & Frameworks
- **shadcn/ui + Radix UI**: UI component primitives.
- **TanStack React Query**: Data fetching and caching.
- **Framer Motion**: UI animations.
- **Lucide React**: Icons.
- **Sharp**: Image optimization.