import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { cache, CACHE_KEYS, CACHE_TTL } from "./cache";
import { eq, desc } from "drizzle-orm";
import { insertAdminUserSchema, insertCategorySchema, insertProductSchema, insertProductVariantSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, insertUserSchema, couponRedemptions, orders, coupons } from "@shared/schema";
import "./types";
import { optimizeImage, optimizeImageBuffer, optimizeUploadedFiles } from "./imageOptimizer";
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPreparingNotificationEmail,
  sendShippingNotificationEmail, 
  sendAdminOrderNotificationEmail,
  sendPasswordResetEmail,
  sendReviewRequestEmail,
  sendTestEmail,
  sendAbandonedCartEmail 
} from "./emailService";
import { getPayTRToken, verifyPayTRCallback, type PayTRCallbackData } from "./paytr";
import { sendInvoiceToBizimHesap } from "./bizimhesap";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "client/public/uploads");

// Ensure upload directories exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};
ensureDir(path.join(uploadDir, "products"));
ensureDir(path.join(uploadDir, "categories"));
ensureDir(path.join(uploadDir, "hero"));

const VALID_UPLOAD_TYPES = ['products', 'categories', 'hero', 'branding'];

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type || "products";
    if (!VALID_UPLOAD_TYPES.includes(type)) {
      return cb(new Error("Invalid upload type"), "");
    }
    const dest = path.join(uploadDir, type);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Social Media Crawler Detection - serves pre-rendered OG tags for bots
  const crawlerPatterns = [
    'facebookexternalhit',
    'Facebot',
    'WhatsApp',
    'Twitterbot',
    'LinkedInBot',
    'Slackbot',
    'TelegramBot',
    'Pinterest',
    'Discordbot',
    'Googlebot',
    'bingbot'
  ];

  const isCrawler = (userAgent: string | undefined): boolean => {
    if (!userAgent) return false;
    return crawlerPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const normalizeImageUrl = (baseUrl: string, imageUrl: string): string => {
    if (!imageUrl) return `${baseUrl}/logo.png`;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  // Product page crawler middleware
  app.get('/urun/:slug', async (req, res, next) => {
    const userAgent = req.get('user-agent');
    
    if (!isCrawler(userAgent)) {
      return next();
    }

    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const pageUrl = `${baseUrl}/urun/${product.slug}`;
      const mainImage = product.images && product.images.length > 0 
        ? normalizeImageUrl(baseUrl, product.images[0])
        : `${baseUrl}/logo.png`;
      const price = parseFloat(product.basePrice || '0');
      const description = product.description 
        ? escapeHtml(product.description.substring(0, 200))
        : `${escapeHtml(product.name)} - HANK premium fitness giyim`;

      const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(product.name)} | HANK</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="product">
  <meta property="og:title" content="${escapeHtml(product.name)}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${mainImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="HANK">
  <meta property="og:locale" content="tr_TR">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="TRY">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(product.name)}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${mainImage}">
  
  <link rel="canonical" href="${pageUrl}">
</head>
<body>
  <h1>${escapeHtml(product.name)}</h1>
  <p>${description}</p>
  <p>Fiyat: ${price.toLocaleString('tr-TR')} TL</p>
  <img src="${mainImage}" alt="${escapeHtml(product.name)}">
  <a href="${pageUrl}">Ürünü Görüntüle</a>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Crawler middleware error:', error);
      next();
    }
  });

  // Category page crawler middleware
  app.get('/kategori/:slug', async (req, res, next) => {
    const userAgent = req.get('user-agent');
    
    if (!isCrawler(userAgent)) {
      return next();
    }

    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const pageUrl = `${baseUrl}/kategori/${category.slug}`;
      const mainImage = category.image 
        ? normalizeImageUrl(baseUrl, category.image)
        : `${baseUrl}/logo.png`;
      const description = `${escapeHtml(category.name)} koleksiyonu - HANK premium fitness ve bodybuilding giyim`;

      const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(category.name)} | HANK</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(category.name)} | HANK">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${mainImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="HANK">
  <meta property="og:locale" content="tr_TR">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(category.name)} | HANK">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${mainImage}">
  
  <link rel="canonical" href="${pageUrl}">
</head>
<body>
  <h1>${escapeHtml(category.name)}</h1>
  <p>${description}</p>
  <img src="${mainImage}" alt="${escapeHtml(category.name)}">
  <a href="${pageUrl}">Koleksiyonu Görüntüle</a>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      console.error('Crawler middleware error:', error);
      next();
    }
  });

  // Admin Authentication
  app.post("/api/admin/login", async (req: Request, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getAdminUserByUsername(username);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.adminId = user.id;
      res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req: Request, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/me", async (req: Request, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getAdminUser(req.session.adminId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ id: user.id, username: user.username });
  });

  // Middleware for admin routes
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.adminId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Allowed upload types for security
  const ALLOWED_UPLOAD_TYPES = ['products', 'categories', 'hero', 'branding'];

  // File Upload Route with type validation and image optimization
  app.post("/api/admin/upload/:type", requireAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const type = req.params.type;
      
      if (!ALLOWED_UPLOAD_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid upload type" });
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      // Optimize uploaded images
      const urls = await optimizeUploadedFiles(files);
      console.log(`[Upload] Optimized ${urls.length} images for ${type}`);
      res.json({ urls });
    } catch (error) {
      console.error('[Upload] Error:', error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Delete uploaded file with path validation
  app.delete("/api/admin/upload", requireAdmin, (req, res) => {
    try {
      const { path: filePath } = req.body;
      
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      if (!filePath.startsWith("/uploads/")) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      if (filePath.includes('..') || filePath.includes('//')) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      const pathParts = filePath.split('/').filter(Boolean);
      if (pathParts.length < 3 || pathParts[0] !== 'uploads' || !ALLOWED_UPLOAD_TYPES.includes(pathParts[1])) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      const fullPath = path.join(process.cwd(), "client/public", filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Delete failed" });
    }
  });

  // Admin Stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { search } = req.query;
      const users = await storage.getUsers(search as string);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin Products (all products including inactive)
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // User Authentication
  app.post("/api/auth/register", async (req: Request, res) => {
    try {
      const { email, password, firstName, lastName, phone, address, city, district, postalCode } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        address,
        city,
        district,
        postalCode,
      });

      req.session.userId = user.id;
      
      // If address info is provided, create a saved address
      if (address && city && district && firstName && lastName && phone) {
        await storage.createUserAddress({
          userId: user.id,
          title: 'Ev Adresi',
          firstName,
          lastName,
          phone,
          address,
          city,
          district,
          postalCode: postalCode || undefined,
          isDefault: true,
        });
      }
      
      // Send welcome email (don't wait)
      sendWelcomeEmail(user).catch(err => console.error('[Email] Welcome email failed:', err));
      
      res.status(201).json({ 
        success: true, 
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: "Kayıt işlemi başarısız" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "E-posta veya şifre hatalı" });
      }

      req.session.userId = user.id;
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } 
      });
    } catch (error) {
      res.status(500).json({ error: "Giriş işlemi başarısız" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res) => {
    req.session.userId = undefined;
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, createdAt: user.createdAt });
  });

  app.patch("/api/auth/profile", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const { firstName, lastName, phone } = req.body;
      const updated = await storage.updateUser(req.session.userId, { firstName, lastName, phone });
      if (!updated) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      res.json({ id: updated.id, email: updated.email, firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone });
    } catch (error) {
      res.status(500).json({ error: "Profil güncellenemedi" });
    }
  });

  // User Addresses API
  app.get("/api/auth/addresses", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const addresses = await storage.getUserAddresses(req.session.userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Adresler yüklenemedi" });
    }
  });

  app.post("/api/auth/addresses", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const { title, firstName, lastName, phone, address, city, district, postalCode, isDefault } = req.body;
      
      // Check if this is the first address - if so, make it default
      const existingAddresses = await storage.getUserAddresses(req.session.userId);
      const shouldBeDefault = existingAddresses.length === 0 ? true : !!isDefault;
      
      const newAddress = await storage.createUserAddress({
        userId: req.session.userId,
        title: title || 'Adresim',
        firstName,
        lastName,
        phone,
        address,
        city,
        district,
        postalCode,
        isDefault: shouldBeDefault,
      });
      res.status(201).json(newAddress);
    } catch (error) {
      res.status(500).json({ error: "Adres eklenemedi" });
    }
  });

  app.patch("/api/auth/addresses/:id", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const existingAddress = await storage.getUserAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.session.userId) {
        return res.status(404).json({ error: "Adres bulunamadı" });
      }

      const { title, firstName, lastName, phone, address, city, district, postalCode, isDefault } = req.body;
      const updated = await storage.updateUserAddress(req.params.id, {
        title,
        firstName,
        lastName,
        phone,
        address,
        city,
        district,
        postalCode,
        isDefault,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Adres güncellenemedi" });
    }
  });

  app.delete("/api/auth/addresses/:id", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const existingAddress = await storage.getUserAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.session.userId) {
        return res.status(404).json({ error: "Adres bulunamadı" });
      }

      await storage.deleteUserAddress(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Adres silinemedi" });
    }
  });

  app.patch("/api/auth/addresses/:id/default", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const existingAddress = await storage.getUserAddress(req.params.id);
      if (!existingAddress || existingAddress.userId !== req.session.userId) {
        return res.status(404).json({ error: "Adres bulunamadı" });
      }

      await storage.setDefaultAddress(req.session.userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Varsayılan adres ayarlanamadı" });
    }
  });

  app.get("/api/orders/my", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      const orders = await storage.getOrdersByEmail(user.email);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Siparişler yüklenemedi" });
    }
  });

  app.get("/api/orders/my/:id", async (req: Request, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Giriş yapılmamış" });
    }

    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Sipariş bulunamadı" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user || order.customerEmail !== user.email) {
        return res.status(403).json({ error: "Bu siparişe erişim yetkiniz yok" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Sipariş yüklenemedi" });
    }
  });

  // Public Order Tracking API
  app.get("/api/orders/track", async (req: Request, res) => {
    try {
      const { orderNumber, email } = req.query;
      
      if (!orderNumber || typeof orderNumber !== 'string') {
        return res.status(400).json({ error: "Sipariş numarası gerekli" });
      }

      const order = await storage.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Sipariş bulunamadı" });
      }

      // If email provided, verify it matches (optional security)
      if (email && typeof email === 'string' && order.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ error: "Sipariş bulunamadı" });
      }

      const items = await storage.getOrderItems(order.id);
      
      // Return limited info for public tracking
      res.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        createdAt: order.createdAt,
        total: order.total,
        shippingCost: order.shippingCost,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        shippingCarrier: order.shippingCarrier,
        shippingAddress: order.shippingAddress,
        items: items.map(item => ({
          id: item.id,
          productName: item.productName,
          variantDetails: item.variantDetails,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      });
    } catch (error) {
      console.error('[Order Track] Error:', error);
      res.status(500).json({ error: "Sipariş bilgisi alınamadı" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  app.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, isFeatured, isNew, search, minPrice, maxPrice, sort } = req.query;
      const products = await storage.getProducts({
        categoryId: categoryId as string,
        isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
        isNew: isNew !== undefined ? isNew === 'true' : undefined,
        search: search as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        sort: sort as 'price_asc' | 'price_desc' | 'newest' | 'popular' | undefined,
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      const variants = await storage.getProductVariants(product.id);
      res.json({ ...product, variants });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      
      // Auto-create variants for all size/color combinations
      const sizes = product.availableSizes || [];
      const colors = product.availableColors || [];
      const baseSku = product.sku || '';
      
      if (sizes.length > 0) {
        if (colors.length > 0) {
          // Create variant for each size/color combination
          for (const size of sizes) {
            for (const color of colors as Array<{name: string, hex: string}>) {
              const variantSku = baseSku ? `${baseSku}-${size}` : null;
              await storage.createProductVariant({
                productId: product.id,
                size: size,
                color: color.name,
                sku: variantSku,
                stock: 0,
                price: product.basePrice,
              });
            }
          }
        } else {
          // Create variant for each size only (no color)
          for (const size of sizes) {
            const variantSku = baseSku ? `${baseSku}-${size}` : null;
            await storage.createProductVariant({
              productId: product.id,
              size: size,
              color: null,
              sku: variantSku,
              stock: 0,
              price: product.basePrice,
            });
          }
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      console.log('Updating product:', req.params.id, 'with data:', JSON.stringify(req.body, null, 2));
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Auto-create missing variants for new size/color combinations
      const sizes = product.availableSizes || [];
      const colors = product.availableColors || [];
      const baseSku = product.sku || '';
      const existingVariants = await storage.getProductVariants(product.id);
      
      if (sizes.length > 0) {
        if (colors.length > 0) {
          // Create variant for each size/color combination
          for (const size of sizes) {
            for (const color of colors as Array<{name: string, hex: string}>) {
              const exists = existingVariants.some(v => v.size === size && v.color === color.name);
              if (!exists) {
                const variantSku = baseSku ? `${baseSku}-${size}` : null;
                await storage.createProductVariant({
                  productId: product.id,
                  size: size,
                  color: color.name,
                  sku: variantSku,
                  stock: 0,
                  price: product.basePrice,
                });
                console.log(`Created missing variant: ${size} / ${color.name} for product ${product.id}`);
              }
            }
          }
        } else {
          // Create variant for each size only (no color)
          for (const size of sizes) {
            const exists = existingVariants.some(v => v.size === size && !v.color);
            if (!exists) {
              const variantSku = baseSku ? `${baseSku}-${size}` : null;
              await storage.createProductVariant({
                productId: product.id,
                size: size,
                color: null,
                sku: variantSku,
                stock: 0,
                price: product.basePrice,
              });
              console.log(`Created missing variant: ${size} for product ${product.id}`);
            }
          }
        }
      }
      
      console.log('Updated product result:', JSON.stringify(product, null, 2));
      res.json(product);
    } catch (error) {
      console.error('Product update error:', error);
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Bulk price update by category
  app.post("/api/admin/products/bulk-price", requireAdmin, async (req, res) => {
    try {
      const { categoryId, action, value } = req.body;
      
      if (!categoryId || !action || value === undefined) {
        return res.status(400).json({ error: "categoryId, action and value are required" });
      }
      
      // Get all products in the category
      const allProducts = await storage.getProducts();
      const categoryProducts = allProducts.filter(p => p.categoryId === categoryId);
      
      if (categoryProducts.length === 0) {
        return res.status(400).json({ error: "Bu kategoride ürün bulunamadı" });
      }
      
      let updated = 0;
      
      for (const product of categoryProducts) {
        let newPrice: number;
        const currentPrice = parseFloat(product.basePrice);
        
        switch (action) {
          case 'set':
            newPrice = value;
            break;
          case 'increase':
            newPrice = currentPrice + value;
            break;
          case 'decrease':
            newPrice = Math.max(0, currentPrice - value);
            break;
          case 'percent_increase':
            newPrice = currentPrice * (1 + value / 100);
            break;
          case 'percent_decrease':
            newPrice = currentPrice * (1 - value / 100);
            break;
          default:
            continue;
        }
        
        // Round to 2 decimal places
        newPrice = Math.round(newPrice * 100) / 100;
        
        await storage.updateProduct(product.id, { basePrice: String(newPrice) });
        updated++;
      }
      
      res.json({ success: true, updated });
    } catch (error) {
      console.error('Bulk price update error:', error);
      res.status(500).json({ error: "Toplu fiyat güncellemesi başarısız" });
    }
  });

  // Delete all products (for WooCommerce re-import)
  app.delete("/api/admin/products-all", requireAdmin, async (req, res) => {
    try {
      const result = await storage.deleteAllProducts();
      
      // Delete image files
      for (const imagePath of result.imagePaths) {
        try {
          const fullPath = path.join(process.cwd(), 'client/public', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (fileError) {
          console.error(`Failed to delete image: ${imagePath}`, fileError);
        }
      }
      
      res.json({ 
        success: true, 
        deletedProducts: result.deletedProducts,
        deletedVariants: result.deletedVariants,
        deletedImages: result.imagePaths.length
      });
    } catch (error: any) {
      console.error('Delete all products error:', error);
      res.status(500).json({ error: error.message || "Failed to delete products" });
    }
  });

  // Product Variants API
  app.get("/api/products/:productId/variants", async (req, res) => {
    try {
      const variants = await storage.getProductVariants(req.params.productId);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variants" });
    }
  });

  app.post("/api/admin/products/:productId/variants", requireAdmin, async (req, res) => {
    try {
      const validated = insertProductVariantSchema.parse({
        ...req.body,
        productId: req.params.productId,
      });
      const variant = await storage.createProductVariant(validated);
      res.status(201).json(variant);
    } catch (error) {
      res.status(400).json({ error: "Invalid variant data" });
    }
  });

  app.patch("/api/admin/variants/:id", requireAdmin, async (req, res) => {
    try {
      const variant = await storage.updateProductVariant(req.params.id, req.body);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }
      res.json(variant);
    } catch (error) {
      res.status(400).json({ error: "Failed to update variant" });
    }
  });

  app.delete("/api/admin/variants/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProductVariant(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  });

  // Cart API
  app.get("/api/cart", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      const items = await storage.getCartItems(sessionId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      const { productId, variantId, quantity } = req.body;
      
      // Check if product requires variant selection
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(400).json({ error: "Geçersiz ürün" });
      }
      
      // If product has available sizes, variant is required
      if (product.availableSizes && product.availableSizes.length > 0 && !variantId) {
        return res.status(400).json({ error: "Lütfen beden seçimi yapın" });
      }
      
      // If variant provided, verify it exists and belongs to this product
      if (variantId) {
        const variant = await storage.getProductVariant(variantId);
        if (!variant) {
          return res.status(400).json({ error: "Geçersiz varyant seçimi" });
        }
        if (variant.productId !== productId) {
          return res.status(400).json({ error: "Geçersiz varyant" });
        }
        if (variant.stock <= 0) {
          return res.status(400).json({ error: "Bu beden stokta yok" });
        }
      }
      
      const validated = insertCartItemSchema.parse({
        productId,
        variantId,
        quantity: quantity || 1,
        sessionId,
      });
      const item = await storage.addToCart(validated);
      res.status(201).json(item);
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(400).json({ error: "Sepete eklenemedi" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.updateCartItem(req.params.id, quantity);
      if (!item) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      await storage.clearCart(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  // Favorites API
  app.get("/api/favorites", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Please login to view favorites" });
      }
      const favoriteProducts = await storage.getFavoriteProducts(userId);
      res.json(favoriteProducts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/ids", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.json([]);
      }
      const ids = await storage.getUserFavoriteProductIds(userId);
      res.json(ids);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorite ids" });
    }
  });

  app.get("/api/favorites/:productId/check", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.json({ isFavorite: false });
      }
      const isFavorite = await storage.isFavorite(userId, req.params.productId);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  app.post("/api/favorites/:productId", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Please login to add favorites" });
      }
      const favorite = await storage.addFavorite({ userId, productId: req.params.productId });
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:productId", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Please login to remove favorites" });
      }
      await storage.removeFavorite(userId, req.params.productId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  // Reviews API
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/products/:productId/rating", async (req, res) => {
    try {
      const rating = await storage.getProductAverageRating(req.params.productId);
      res.json(rating);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rating" });
    }
  });

  app.post("/api/products/:productId/reviews", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Please login to write a review" });
      }

      // Check if user already reviewed this product
      const existingReview = await storage.getUserReview(userId, req.params.productId);
      if (existingReview) {
        return res.status(400).json({ error: "You have already reviewed this product" });
      }

      const { rating, title, content } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const review = await storage.createReview({
        productId: req.params.productId,
        userId,
        rating,
        title: title || null,
        content: content || null,
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/products/:productId/my-review", async (req: Request, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.json(null);
      }
      const review = await storage.getUserReview(userId, req.params.productId);
      res.json(review || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  // PayTR Payment API
  app.post("/api/payment/create", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      const userId = (req.session as any).userId || null;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Sepet boş" });
      }

      const { customerName, customerEmail, customerPhone, address, city, district, postalCode, couponCode, createAccount, accountPassword } = req.body;

      // Validate required fields
      if (!customerName || !customerEmail || !customerPhone || !address || !city || !district) {
        return res.status(400).json({ error: "Lütfen tüm alanları doldurun" });
      }

      // Validate password if creating account
      let accountPasswordHash = null;
      if (createAccount && accountPassword) {
        if (accountPassword.length < 6) {
          return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
        }
        // Check if email already exists
        const existingUser = await storage.getUserByEmail(customerEmail);
        if (existingUser) {
          return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı. Giriş yaparak devam edebilirsiniz." });
        }
        accountPasswordHash = await bcrypt.hash(accountPassword, 10);
      }

      // Calculate actual subtotal from cart items (server-side verification)
      let serverSubtotal = 0;
      const cartItemsForStorage: Array<{
        productId: string;
        variantId: string | null;
        quantity: number;
        productName: string;
        variantDetails: string | null;
        price: string;
      }> = [];

      const userBasket: Array<[string, string, number]> = [];

      for (const cartItem of cartItems) {
        const variant = cartItem.variantId 
          ? await storage.getProductVariant(cartItem.variantId)
          : null;
        
        // If variant exists, get the product from variant's productId to ensure consistency
        const actualProductId = variant?.productId || cartItem.productId;
        const product = await storage.getProduct(actualProductId);
        
        if (product) {
          const itemPrice = parseFloat(product.basePrice);
          serverSubtotal += itemPrice * cartItem.quantity;
          
          cartItemsForStorage.push({
            productId: product.id,
            variantId: variant?.id || null,
            quantity: cartItem.quantity,
            productName: product.name,
            variantDetails: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,
            price: product.basePrice,
          });

          // PayTR basket format: [name, price in kuruş, quantity]
          userBasket.push([
            product.name.substring(0, 50), // Max 50 chars for product name
            Math.round(itemPrice * 100).toString(), // Price in kuruş
            cartItem.quantity
          ]);
        }
      }

      // Handle coupon validation
      let validatedCoupon = null;
      let discountAmount = 0;
      
      if (couponCode) {
        const couponResult = await storage.validateCoupon(couponCode, serverSubtotal, userId);
        if (couponResult.valid && couponResult.coupon) {
          validatedCoupon = couponResult.coupon;
          if (validatedCoupon.discountType === 'percentage') {
            discountAmount = (serverSubtotal * parseFloat(validatedCoupon.discountValue)) / 100;
          } else {
            discountAmount = parseFloat(validatedCoupon.discountValue);
          }
          discountAmount = Math.min(discountAmount, serverSubtotal);
        }
      }

      // Calculate shipping and total
      const FREE_SHIPPING_THRESHOLD = 2500;
      const shippingCost = serverSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 200;
      const serverTotal = Math.max(0, serverSubtotal - discountAmount + shippingCost);

      // Generate unique merchant order ID
      const merchantOid = `HNK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Get user IP
      const userIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || 
                     req.socket.remoteAddress || 
                     '127.0.0.1';

      // Get base URL for success/fail URLs - use production domain for PayTR
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://hank.com.tr' 
        : `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || 'localhost:5000'}`;

      // Create pending payment record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

      await storage.createPendingPayment({
        merchantOid,
        sessionId,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress: { address, city, district, postalCode: postalCode || '' },
        cartItems: cartItemsForStorage,
        subtotal: serverSubtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        couponCode: validatedCoupon?.code || null,
        total: serverTotal.toFixed(2),
        status: 'pending',
        paytrToken: null,
        createAccount: createAccount || false,
        accountPasswordHash: accountPasswordHash,
        expiresAt,
      });

      // Request PayTR token
      const paytrResponse = await getPayTRToken({
        merchantOid,
        userIp,
        email: customerEmail,
        paymentAmount: Math.round(serverTotal * 100), // Convert to kuruş
        userName: customerName,
        userAddress: `${address}, ${district}, ${city}`,
        userPhone: customerPhone,
        userBasket,
        okUrl: `${baseUrl}/odeme-basarili?oid=${merchantOid}`,
        failUrl: `${baseUrl}/odeme-basarisiz?oid=${merchantOid}`,
        noInstallment: '1', // Disable installments
        currency: 'TL',
        testMode: process.env.NODE_ENV === 'production' ? '0' : '1',
        debugOn: '1',
      });

      if (paytrResponse.status === 'success' && paytrResponse.token) {
        // Update pending payment with token
        await storage.updatePendingPaymentStatus(merchantOid, 'token_received');
        
        res.json({
          success: true,
          token: paytrResponse.token,
          merchantOid,
          iframeUrl: `https://www.paytr.com/odeme/guvenli/${paytrResponse.token}`,
        });
      } else {
        // Delete pending payment on failure
        await storage.deletePendingPayment(merchantOid);
        console.error('[PayTR] Token request failed:', paytrResponse.reason);
        res.status(400).json({ 
          error: 'Ödeme sistemi bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.',
          reason: paytrResponse.reason 
        });
      }
    } catch (error) {
      console.error('[PayTR] Payment creation error:', error);
      res.status(500).json({ error: "Ödeme işlemi başlatılamadı" });
    }
  });

  // PayTR Callback (Notification URL) - receives payment results
  app.post("/api/payment/callback", async (req: Request, res) => {
    try {
      const callbackData = req.body as PayTRCallbackData;
      
      console.log('[PayTR Callback] Received:', {
        merchant_oid: callbackData.merchant_oid,
        status: callbackData.status,
        total_amount: callbackData.total_amount
      });

      // Verify hash
      if (!verifyPayTRCallback(callbackData)) {
        console.error('[PayTR Callback] Hash verification failed');
        return res.send('PAYTR notification failed: bad hash');
      }

      const pendingPayment = await storage.getPendingPaymentByMerchantOid(callbackData.merchant_oid);
      if (!pendingPayment) {
        console.error('[PayTR Callback] Pending payment not found:', callbackData.merchant_oid);
        return res.send('OK'); // Return OK to prevent retries
      }

      // Check if already processed
      if (pendingPayment.status === 'completed' || pendingPayment.status === 'failed') {
        console.log('[PayTR Callback] Payment already processed:', callbackData.merchant_oid);
        return res.send('OK');
      }

      if (callbackData.status === 'success') {
        // Payment successful - create the actual order
        const orderNumber = callbackData.merchant_oid;

        // Create order
        const order = await storage.createOrder({
          orderNumber,
          customerName: pendingPayment.customerName,
          customerEmail: pendingPayment.customerEmail,
          customerPhone: pendingPayment.customerPhone,
          shippingAddress: pendingPayment.shippingAddress,
          subtotal: pendingPayment.subtotal,
          shippingCost: pendingPayment.shippingCost,
          discountAmount: pendingPayment.discountAmount || '0',
          couponCode: pendingPayment.couponCode,
          total: pendingPayment.total,
          status: 'confirmed',
          paymentMethod: 'credit_card',
          paymentStatus: 'paid',
        });

        // Create order items and reduce stock
        for (const item of pendingPayment.cartItems) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantDetails: item.variantDetails,
            price: item.price,
            quantity: item.quantity,
            subtotal: (parseFloat(item.price) * item.quantity).toFixed(2),
          });

          // Reduce stock for the variant
          if (item.variantId) {
            const variant = await storage.getProductVariant(item.variantId);
            if (variant) {
              const newStock = Math.max(0, variant.stock - item.quantity);
              await storage.updateProductVariant(item.variantId, { stock: newStock });
              
              await storage.createStockAdjustment({
                variantId: item.variantId,
                previousStock: variant.stock,
                newStock: newStock,
                adjustmentType: 'sale',
                reason: `Sipariş: ${orderNumber}`,
              });
            }
          }
        }

        // Handle coupon redemption
        if (pendingPayment.couponCode) {
          const coupon = await storage.getCouponByCode(pendingPayment.couponCode);
          if (coupon) {
            await storage.redeemCoupon(coupon.id, order.id, null, parseFloat(pendingPayment.discountAmount || '0'));
            
            // Update influencer commission if applicable
            if (coupon.isInfluencerCode) {
              let commission = 0;
              const orderTotal = parseFloat(pendingPayment.total);
              
              switch (coupon.commissionType) {
                case 'percentage':
                  commission = (orderTotal * parseFloat(coupon.commissionValue || '0')) / 100;
                  break;
                case 'per_use':
                  commission = parseFloat(coupon.commissionValue || '0');
                  break;
              }
              
              if (commission > 0) {
                const currentCommission = parseFloat(coupon.totalCommissionEarned || '0');
                await storage.updateCoupon(coupon.id, {
                  totalCommissionEarned: (currentCommission + commission).toFixed(2),
                });
              }
            }
          }
        }

        // Clear cart
        await storage.clearCart(pendingPayment.sessionId);

        // Update pending payment status
        await storage.updatePendingPaymentStatus(callbackData.merchant_oid, 'completed');

        // Send confirmation emails
        const orderItems = await storage.getOrderItems(order.id);
        sendOrderConfirmationEmail(order, orderItems).catch(err => console.error('[Email] Order confirmation failed:', err));
        sendAdminOrderNotificationEmail(order, orderItems).catch(err => console.error('[Email] Admin notification failed:', err));

        // Fetch variant SKUs for invoice
        const variantSkus = new Map<string, string>();
        for (const item of orderItems) {
          if (item.variantId) {
            const variant = await storage.getProductVariant(item.variantId);
            if (variant?.sku) {
              variantSkus.set(item.variantId, variant.sku);
            }
          }
        }

        // Send invoice to BizimHesap
        sendInvoiceToBizimHesap(order, orderItems, variantSkus).catch(err => console.error('[BizimHesap] Invoice failed:', err));

        // Create user account if requested during checkout
        if (pendingPayment.createAccount && pendingPayment.accountPasswordHash) {
          try {
            // Check if user doesn't already exist
            const existingUser = await storage.getUserByEmail(pendingPayment.customerEmail);
            if (!existingUser) {
              // Parse name to firstName and lastName
              const nameParts = pendingPayment.customerName.trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              const shippingAddr = pendingPayment.shippingAddress as {
                address: string;
                city: string;
                district: string;
                postalCode: string;
              };

              // Create the user
              const newUser = await storage.createUser({
                email: pendingPayment.customerEmail,
                password: pendingPayment.accountPasswordHash, // Already hashed
                firstName,
                lastName,
                phone: pendingPayment.customerPhone,
                address: shippingAddr.address,
                city: shippingAddr.city,
                district: shippingAddr.district,
                postalCode: shippingAddr.postalCode || null,
              });

              // Create saved address
              await storage.createUserAddress({
                userId: newUser.id,
                title: 'Teslimat Adresi',
                firstName,
                lastName,
                phone: pendingPayment.customerPhone,
                address: shippingAddr.address,
                city: shippingAddr.city,
                district: shippingAddr.district,
                postalCode: shippingAddr.postalCode || null,
                isDefault: true,
              });

              // Send welcome email
              sendWelcomeEmail(newUser).catch(err => console.error('[Email] Welcome email failed:', err));

              console.log('[PayTR Callback] User account created:', newUser.email);
            }
          } catch (userError) {
            console.error('[PayTR Callback] Failed to create user account:', userError);
            // Don't fail the order, just log the error
          }
        }

        console.log('[PayTR Callback] Order created successfully:', orderNumber);
      } else {
        // Payment failed
        await storage.updatePendingPaymentStatus(callbackData.merchant_oid, 'failed');
        console.log('[PayTR Callback] Payment failed:', callbackData.merchant_oid, callbackData.failed_reason_msg);
      }

      // MUST return "OK" to PayTR
      res.send('OK');
    } catch (error) {
      console.error('[PayTR Callback] Error:', error);
      res.send('OK'); // Still return OK to prevent infinite retries
    }
  });

  // Check payment status
  app.get("/api/payment/status/:merchantOid", async (req: Request, res) => {
    try {
      const pendingPayment = await storage.getPendingPaymentByMerchantOid(req.params.merchantOid);
      if (!pendingPayment) {
        return res.status(404).json({ error: "Ödeme bulunamadı" });
      }

      // If completed, get the order
      if (pendingPayment.status === 'completed') {
        const order = await storage.getOrderByNumber(pendingPayment.merchantOid);
        return res.json({
          status: 'completed',
          orderNumber: order?.orderNumber,
          orderId: order?.id,
        });
      }

      res.json({ status: pendingPayment.status });
    } catch (error) {
      res.status(500).json({ error: "Ödeme durumu alınamadı" });
    }
  });

  // Orders API
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const items = await storage.getOrderItems(order.id);
      
      // Enrich items with SKU and product image
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          let sku = null;
          let productImage = null;
          
          if (item.variantId) {
            const variant = await storage.getProductVariant(item.variantId);
            sku = variant?.sku || null;
            if (variant?.productId) {
              const product = await storage.getProduct(variant.productId);
              productImage = product?.images?.[0] || null;
              if (!sku) sku = product?.sku || null;
            }
          }
          if (!productImage && item.productId) {
            const product = await storage.getProduct(item.productId);
            productImage = product?.images?.[0] || null;
            if (!sku) sku = product?.sku || null;
          }
          return { ...item, sku, productImage };
        })
      );
      
      res.json({ ...order, items: itemsWithDetails });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      const userId = (req.session as any).userId || null;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Generate order number
      const orderNumber = `HNK${Date.now()}`;
      
      // Calculate actual subtotal from cart items (server-side verification)
      let serverSubtotal = 0;
      for (const cartItem of cartItems) {
        const variant = cartItem.variantId 
          ? await storage.getProductVariant(cartItem.variantId)
          : null;
        // Use variant's productId if available to ensure consistency
        const actualProductId = variant?.productId || cartItem.productId;
        const product = await storage.getProduct(actualProductId);
        if (product) {
          const itemPrice = parseFloat(product.basePrice);
          serverSubtotal += itemPrice * cartItem.quantity;
        }
      }
      
      // Handle coupon validation and redemption - recalculate discount on server
      let validatedCoupon = null;
      let discountAmount = 0;
      
      if (req.body.couponCode) {
        const couponResult = await storage.validateCoupon(
          req.body.couponCode,
          serverSubtotal,
          userId
        );
        
        if (couponResult.valid && couponResult.coupon) {
          validatedCoupon = couponResult.coupon;
          
          // Recalculate discount on server to prevent tampering
          if (validatedCoupon.discountType === 'percentage') {
            discountAmount = (serverSubtotal * parseFloat(validatedCoupon.discountValue)) / 100;
          } else {
            discountAmount = parseFloat(validatedCoupon.discountValue);
          }
          // Clamp discount to subtotal
          discountAmount = Math.min(discountAmount, serverSubtotal);
        }
      }
      
      // Calculate shipping and total on server
      const FREE_SHIPPING_THRESHOLD = 2500;
      const shippingCost = serverSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 200;
      const serverTotal = Math.max(0, serverSubtotal - discountAmount + shippingCost);
      
      const validated = insertOrderSchema.parse({
        ...req.body,
        orderNumber,
        subtotal: serverSubtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        couponCode: validatedCoupon?.code || null,
        discountAmount: discountAmount.toFixed(2),
        total: serverTotal.toFixed(2),
      });

      const order = await storage.createOrder(validated);
      
      // Record coupon redemption and update influencer commission
      if (validatedCoupon) {
        await storage.redeemCoupon(validatedCoupon.id, order.id, userId, discountAmount);
        
        // If it's an influencer code, update their commission
        if (validatedCoupon.isInfluencerCode) {
          let commission = 0;
          
          switch (validatedCoupon.commissionType) {
            case 'percentage':
              // Commission based on order total (after discount and shipping)
              commission = (serverTotal * parseFloat(validatedCoupon.commissionValue || '0')) / 100;
              break;
            case 'per_use':
              commission = parseFloat(validatedCoupon.commissionValue || '0');
              break;
            case 'fixed_total':
              // Fixed total is a one-time payment, tracked separately
              break;
          }
          
          if (commission > 0) {
            const currentCommission = parseFloat(validatedCoupon.totalCommissionEarned || '0');
            await storage.updateCoupon(validatedCoupon.id, {
              totalCommissionEarned: (currentCommission + commission).toFixed(2),
            });
          }
        }
      }

      // Create order items and reduce stock
      for (const cartItem of cartItems) {
        const variant = cartItem.variantId 
          ? await storage.getProductVariant(cartItem.variantId)
          : null;
        // Use variant's productId if available to ensure consistency
        const actualProductId = variant?.productId || cartItem.productId;
        const product = await storage.getProduct(actualProductId);

        if (product) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: product.id,
            variantId: variant?.id,
            productName: product.name,
            variantDetails: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,
            price: product.basePrice,
            quantity: cartItem.quantity,
            subtotal: ((parseFloat(product.basePrice) * cartItem.quantity).toFixed(2)),
          });

          // Reduce stock for the variant
          if (variant && variant.id) {
            const newStock = Math.max(0, variant.stock - cartItem.quantity);
            await storage.updateProductVariant(variant.id, { stock: newStock });
            
            // Log stock adjustment
            await storage.createStockAdjustment({
              variantId: variant.id,
              previousStock: variant.stock,
              newStock: newStock,
              adjustmentType: 'sale',
              reason: `Sipariş: ${orderNumber}`,
            });
          }
        }
      }

      // Clear cart
      await storage.clearCart(sessionId);
      
      // Get order items for email
      const orderItems = await storage.getOrderItems(order.id);
      
      // Send order confirmation emails (don't wait)
      sendOrderConfirmationEmail(order, orderItems).catch(err => console.error('[Email] Order confirmation failed:', err));
      sendAdminOrderNotificationEmail(order, orderItems).catch(err => console.error('[Email] Admin notification failed:', err));

      res.status(201).json(order);
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(400).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;
      
      // If shipped status, update tracking info as well
      let updateData: any = { status };
      if (status === 'shipped' && trackingNumber) {
        const dhlTrackingUrl = `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${trackingNumber}&submit=1`;
        updateData = {
          ...updateData,
          trackingNumber,
          shippingCarrier: 'DHL Express',
          trackingUrl: dhlTrackingUrl,
        };
      }
      
      const order = await storage.updateOrder(req.params.id, updateData);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      // Send status change emails
      if (status === 'processing') {
        sendPreparingNotificationEmail(order).catch(err => 
          console.error('[Email] Preparing notification failed:', err)
        );
      } else if (status === 'shipped') {
        sendShippingNotificationEmail(order).catch(err => 
          console.error('[Email] Shipping notification failed:', err)
        );
      }
      
      res.json(order);
    } catch (error) {
      console.error('Order status update error:', error);
      res.status(400).json({ error: "Failed to update order status" });
    }
  });

  // Initialize first admin user if none exists
  app.post("/api/admin/init", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if any admin exists
      const existingAdmin = await storage.getAdminUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin user already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const admin = await storage.createAdminUser({
        username,
        password: hashedPassword,
      });

      res.status(201).json({ id: admin.id, username: admin.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // WooCommerce Integration API
  app.get("/api/admin/woocommerce/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getWoocommerceSettings();
      if (settings) {
        // Mask the secret for security
        res.json({
          ...settings,
          consumerSecret: settings.consumerSecret ? '••••••••' : '',
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WooCommerce settings" });
    }
  });

  app.post("/api/admin/woocommerce/settings", requireAdmin, async (req, res) => {
    try {
      const { siteUrl, consumerKey, consumerSecret, isActive } = req.body;
      const settings = await storage.saveWoocommerceSettings({
        siteUrl,
        consumerKey,
        consumerSecret,
        isActive: isActive ?? true,
      });
      res.json({
        ...settings,
        consumerSecret: '••••••••',
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to save WooCommerce settings" });
    }
  });

  app.delete("/api/admin/woocommerce/settings", requireAdmin, async (req, res) => {
    try {
      await storage.deleteWoocommerceSettings();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete WooCommerce settings" });
    }
  });

  app.post("/api/admin/woocommerce/test", requireAdmin, async (req, res) => {
    try {
      const { siteUrl, consumerKey, consumerSecret } = req.body;
      
      // Test connection to WooCommerce API
      const url = new URL('/wp-json/wc/v3/products', siteUrl);
      url.searchParams.set('per_page', '1');
      
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({ 
          success: false, 
          error: `WooCommerce API hatası: ${response.status}`,
          details: errorText
        });
      }
      
      const products = await response.json();
      
      // Get total product count from headers
      const totalProducts = response.headers.get('X-WP-Total') || '0';
      const totalCategories = await fetch(new URL('/wp-json/wc/v3/products/categories?per_page=1', siteUrl).toString(), {
        headers: { 'Authorization': `Basic ${auth}` },
      }).then(r => r.headers.get('X-WP-Total') || '0').catch(() => '0');
      
      res.json({ 
        success: true, 
        productCount: parseInt(totalProducts),
        categoryCount: parseInt(totalCategories),
        message: 'Bağlantı başarılı!'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Bağlantı hatası'
      });
    }
  });

  app.get("/api/admin/woocommerce/logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getWoocommerceSyncLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  app.post("/api/admin/woocommerce/import", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getWoocommerceSettings();
      if (!settings) {
        return res.status(400).json({ error: "WooCommerce ayarları bulunamadı" });
      }

      // Create sync log
      const syncLog = await storage.createWoocommerceSyncLog('running');

      // Start import in background
      (async () => {
        let productsImported = 0;
        let categoriesImported = 0;
        let imagesDownloaded = 0;
        const errors: string[] = [];

        try {
          const auth = Buffer.from(`${settings.consumerKey}:${settings.consumerSecret}`).toString('base64');
          
          // Import categories first
          const categoriesUrl = new URL('/wp-json/wc/v3/products/categories', settings.siteUrl);
          categoriesUrl.searchParams.set('per_page', '100');
          
          const catResponse = await fetch(categoriesUrl.toString(), {
            headers: { 'Authorization': `Basic ${auth}` },
          });
          
          if (catResponse.ok) {
            const wooCategories = await catResponse.json();
            for (const wooCat of wooCategories) {
              try {
                const existingCat = await storage.getCategoryBySlugOrCreate(wooCat.slug);
                if (!existingCat) {
                  // Download and optimize category image if exists
                  let categoryImage = '';
                  if (wooCat.image?.src) {
                    try {
                      const imgRes = await fetch(wooCat.image.src);
                      if (imgRes.ok) {
                        const imgBuffer = await imgRes.arrayBuffer();
                        const fileName = `${wooCat.slug}-${Date.now()}`;
                        const tempFilePath = path.join(process.cwd(), 'client/public/uploads/categories', `${fileName}.tmp`);
                        const optimizedPath = await optimizeImageBuffer(
                          Buffer.from(imgBuffer),
                          tempFilePath
                        );
                        const relativePath = optimizedPath.replace(process.cwd() + '/client/public', '');
                        categoryImage = relativePath;
                        imagesDownloaded++;
                      }
                    } catch (imgError) {
                      errors.push(`Kategori resmi indirilemedi: ${wooCat.name}`);
                    }
                  }
                  
                  await storage.createCategory({
                    name: wooCat.name,
                    slug: wooCat.slug,
                    image: categoryImage,
                    displayOrder: wooCat.menu_order || 0,
                  });
                  categoriesImported++;
                }
              } catch (catError: any) {
                errors.push(`Kategori aktarılamadı: ${wooCat.name} - ${catError.message}`);
              }
            }
          }

          // Import products
          let page = 1;
          let hasMore = true;
          
          while (hasMore) {
            const productsUrl = new URL('/wp-json/wc/v3/products', settings.siteUrl);
            productsUrl.searchParams.set('per_page', '20');
            productsUrl.searchParams.set('page', page.toString());
            productsUrl.searchParams.set('status', 'publish');
            
            const prodResponse = await fetch(productsUrl.toString(), {
              headers: { 'Authorization': `Basic ${auth}` },
            });
            
            if (!prodResponse.ok) {
              errors.push(`Ürünler alınamadı (sayfa ${page})`);
              break;
            }
            
            const wooProducts = await prodResponse.json();
            
            if (wooProducts.length === 0) {
              hasMore = false;
              break;
            }
            
            for (const wooProd of wooProducts) {
              try {
                const existingProd = await storage.getProductBySlug(wooProd.slug);
                if (!existingProd) {
                  // Download and optimize product images
                  const productImages: string[] = [];
                  for (const img of (wooProd.images || [])) {
                    try {
                      const imgRes = await fetch(img.src);
                      if (imgRes.ok) {
                        const imgBuffer = await imgRes.arrayBuffer();
                        const fileName = `${wooProd.slug}-${Date.now()}-${productImages.length + 1}`;
                        const tempFilePath = path.join(process.cwd(), 'client/public/uploads/products', `${fileName}.tmp`);
                        const optimizedPath = await optimizeImageBuffer(
                          Buffer.from(imgBuffer),
                          tempFilePath
                        );
                        const relativePath = optimizedPath.replace(process.cwd() + '/client/public', '');
                        productImages.push(relativePath);
                        imagesDownloaded++;
                      }
                    } catch (imgError) {
                      errors.push(`Ürün resmi indirilemedi: ${wooProd.name}`);
                    }
                  }
                  
                  // Get category ID
                  let categoryId = null;
                  if (wooProd.categories && wooProd.categories.length > 0) {
                    const cat = await storage.getCategoryBySlugOrCreate(wooProd.categories[0].slug);
                    categoryId = cat?.id || null;
                  }
                  
                  // Extract sizes and colors from attributes
                  const availableSizes: string[] = [];
                  const availableColors: { name: string; hex: string }[] = [];
                  
                  for (const attr of (wooProd.attributes || [])) {
                    if (attr.name.toLowerCase().includes('beden') || attr.name.toLowerCase().includes('size')) {
                      availableSizes.push(...(attr.options || []));
                    }
                    if (attr.name.toLowerCase().includes('renk') || attr.name.toLowerCase().includes('color')) {
                      for (const colorName of (attr.options || [])) {
                        availableColors.push({ name: colorName, hex: '#000000' });
                      }
                    }
                  }
                  
                  const newProduct = await storage.createProduct({
                    name: wooProd.name,
                    slug: wooProd.slug,
                    description: wooProd.description?.replace(/<[^>]*>/g, '') || '',
                    sku: wooProd.sku || null,
                    categoryId,
                    basePrice: wooProd.price || wooProd.regular_price || '0',
                    images: productImages,
                    availableSizes,
                    availableColors,
                    isActive: wooProd.status === 'publish',
                    isFeatured: wooProd.featured || false,
                    isNew: false,
                  });
                  productsImported++;
                  
                  // Fetch and create variations for variable products
                  if (wooProd.type === 'variable' && newProduct) {
                    try {
                      const variationsUrl = new URL(`/wp-json/wc/v3/products/${wooProd.id}/variations`, settings.siteUrl);
                      variationsUrl.searchParams.set('per_page', '100');
                      
                      const varResponse = await fetch(variationsUrl.toString(), {
                        headers: { 'Authorization': `Basic ${auth}` },
                      });
                      
                      if (varResponse.ok) {
                        const wooVariations = await varResponse.json();
                        for (const wooVar of wooVariations) {
                          let size = '';
                          let color = '';
                          let colorHex = '#000000';
                          
                          for (const attr of (wooVar.attributes || [])) {
                            if (attr.name.toLowerCase().includes('beden') || attr.name.toLowerCase().includes('size')) {
                              size = attr.option || '';
                            }
                            if (attr.name.toLowerCase().includes('renk') || attr.name.toLowerCase().includes('color')) {
                              color = attr.option || '';
                            }
                          }
                          
                          await storage.createProductVariant({
                            productId: newProduct.id,
                            sku: wooVar.sku || null,
                            size: size || null,
                            color: color || null,
                            colorHex: colorHex,
                            price: wooVar.price || wooProd.price || '0',
                            stock: wooVar.stock_quantity || 0,
                            isActive: wooVar.status === 'publish',
                          });
                        }
                      }
                    } catch (varError: any) {
                      errors.push(`Varyasyonlar alınamadı: ${wooProd.name}`);
                    }
                  } else if (newProduct) {
                    // Simple product - create a single variant
                    if (availableSizes.length > 0 && availableColors.length > 0) {
                      for (const size of availableSizes) {
                        for (const colorObj of availableColors) {
                          await storage.createProductVariant({
                            productId: newProduct.id,
                            sku: wooProd.sku ? `${wooProd.sku}-${size}-${colorObj.name}` : null,
                            size,
                            color: colorObj.name,
                            colorHex: colorObj.hex,
                            price: wooProd.price || '0',
                            stock: wooProd.stock_quantity || 0,
                            isActive: true,
                          });
                        }
                      }
                    } else if (availableSizes.length > 0) {
                      for (const size of availableSizes) {
                        await storage.createProductVariant({
                          productId: newProduct.id,
                          sku: wooProd.sku ? `${wooProd.sku}-${size}` : null,
                          size,
                          color: null,
                          colorHex: null,
                          price: wooProd.price || '0',
                          stock: wooProd.stock_quantity || 0,
                          isActive: true,
                        });
                      }
                    } else if (availableColors.length > 0) {
                      for (const colorObj of availableColors) {
                        await storage.createProductVariant({
                          productId: newProduct.id,
                          sku: wooProd.sku ? `${wooProd.sku}-${colorObj.name}` : null,
                          size: null,
                          color: colorObj.name,
                          colorHex: colorObj.hex,
                          price: wooProd.price || '0',
                          stock: wooProd.stock_quantity || 0,
                          isActive: true,
                        });
                      }
                    } else {
                      // No size or color - create single variant
                      await storage.createProductVariant({
                        productId: newProduct.id,
                        sku: wooProd.sku || null,
                        size: null,
                        color: null,
                        colorHex: null,
                        price: wooProd.price || '0',
                        stock: wooProd.stock_quantity || 0,
                        isActive: true,
                      });
                    }
                  }
                }
              } catch (prodError: any) {
                errors.push(`Ürün aktarılamadı: ${wooProd.name} - ${prodError.message}`);
              }
            }
            
            page++;
            // Safety limit
            if (page > 50) break;
          }

          await storage.updateWoocommerceLastSync();
          await storage.updateWoocommerceSyncLog(syncLog.id, {
            status: 'completed',
            productsImported,
            categoriesImported,
            imagesDownloaded,
            errors,
            completedAt: new Date(),
          });
        } catch (syncError: any) {
          await storage.updateWoocommerceSyncLog(syncLog.id, {
            status: 'failed',
            productsImported,
            categoriesImported,
            imagesDownloaded,
            errors: [...errors, syncError.message],
            completedAt: new Date(),
          });
        }
      })();

      res.json({ success: true, logId: syncLog.id, message: 'İçe aktarma başlatıldı' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "İçe aktarma başlatılamadı" });
    }
  });

  // Analytics Routes
  app.get("/api/admin/analytics/sales", requireAdmin, async (req, res) => {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month' | 'year') || 'month';
      const data = await storage.getSalesAnalytics(period);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales analytics" });
    }
  });

  app.get("/api/admin/analytics/best-sellers", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await storage.getBestSellingProducts(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch best sellers" });
    }
  });

  app.get("/api/admin/analytics/comparison", requireAdmin, async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const data = await storage.getPeriodComparison(thirtyDaysAgo, now, sixtyDaysAgo, thirtyDaysAgo);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comparison data" });
    }
  });

  // Coupon Routes
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });

  app.get("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.getCoupon(req.params.id);
      if (!coupon) return res.status(404).json({ error: "Coupon not found" });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupon" });
    }
  });

  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.createCoupon(req.body);
      res.status(201).json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create coupon" });
    }
  });

  app.put("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.updateCoupon(req.params.id, req.body);
      if (!coupon) return res.status(404).json({ error: "Coupon not found" });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCoupon(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });

  app.get("/api/admin/coupons/by-code/:code", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.getCouponByCode(req.params.code);
      if (!coupon) return res.status(404).json({ error: "Coupon not found" });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coupon" });
    }
  });

  // Public coupon validation
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, orderTotal } = req.body;
      const userId = (req.session as any).userId || null;
      const result = await storage.validateCoupon(code, orderTotal, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });

  // Stock Management Routes
  app.get("/api/admin/inventory", requireAdmin, async (req, res) => {
    try {
      const variants = await storage.getAllVariantsWithProducts();
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/admin/inventory/low-stock", requireAdmin, async (req, res) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5;
      const variants = await storage.getLowStockVariants(threshold);
      res.json(variants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  app.post("/api/admin/inventory/bulk-update", requireAdmin, async (req, res) => {
    try {
      const { updates } = req.body;
      await storage.bulkUpdateStock(updates.map((u: any) => ({
        ...u,
        authorId: req.session.adminId,
      })));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk update stock" });
    }
  });

  app.get("/api/admin/inventory/adjustments", requireAdmin, async (req, res) => {
    try {
      const variantId = req.query.variantId as string | undefined;
      const adjustments = await storage.getStockAdjustments(variantId);
      res.json(adjustments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock adjustments" });
    }
  });

  // Data consistency check
  app.get("/api/admin/inventory/data-check", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const allVariants = await storage.getAllVariantsWithProducts();
      const orders = await storage.getOrders();
      
      const issues = {
        productsWithoutVariants: [] as { id: string; name: string; sku: string | null; availableSizes: string[] }[],
        productsWithMissingVariants: [] as { id: string; name: string; definedSizes: string[]; existingVariantSizes: string[] }[],
        ordersWithoutVariants: [] as { id: string; orderNumber: string; itemsWithoutVariant: { productName: string; variantDetails: string | null }[] }[],
      };

      // Check for products without any variants
      for (const product of products) {
        const productVariants = allVariants.filter(v => v.productId === product.id);
        
        if (productVariants.length === 0 && product.availableSizes && product.availableSizes.length > 0) {
          issues.productsWithoutVariants.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            availableSizes: product.availableSizes as string[],
          });
        } else if (product.availableSizes && product.availableSizes.length > 0) {
          // Check if all sizes have variants
          const existingSizes = productVariants.map(v => v.size).filter(Boolean);
          const definedSizes = product.availableSizes as string[];
          const missingSizes = definedSizes.filter(s => !existingSizes.includes(s));
          
          if (missingSizes.length > 0) {
            issues.productsWithMissingVariants.push({
              id: product.id,
              name: product.name,
              definedSizes: definedSizes,
              existingVariantSizes: existingSizes as string[],
            });
          }
        }
      }

      // Check for orders with items that have no variant
      for (const order of orders) {
        const orderItems = await storage.getOrderItems(order.id);
        const itemsWithoutVariant = orderItems.filter(item => !item.variantId);
        
        if (itemsWithoutVariant.length > 0) {
          issues.ordersWithoutVariants.push({
            id: order.id,
            orderNumber: order.orderNumber,
            itemsWithoutVariant: itemsWithoutVariant.map(item => ({
              productName: item.productName,
              variantDetails: item.variantDetails,
            })),
          });
        }
      }

      res.json({
        summary: {
          productsWithoutVariants: issues.productsWithoutVariants.length,
          productsWithMissingVariants: issues.productsWithMissingVariants.length,
          ordersWithoutVariants: issues.ordersWithoutVariants.length,
        },
        issues,
      });
    } catch (error) {
      console.error('Data check error:', error);
      res.status(500).json({ error: "Failed to check data consistency" });
    }
  });

  // Fix missing variants - syncs variants with product's defined sizes
  app.post("/api/admin/inventory/fix-variants", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const allVariants = await storage.getAllVariantsWithProducts();
      
      let createdCount = 0;
      let deletedCount = 0;
      const createdVariants: { productName: string; size: string; sku: string | null }[] = [];
      const deletedVariants: { productName: string; size: string | null }[] = [];

      for (const product of products) {
        const productVariants = allVariants.filter(v => v.productId === product.id);
        const definedSizes = (product.availableSizes as string[]) || [];
        const colors = (product.availableColors as Array<{name: string, hex: string}>) || [];
        const baseSku = product.sku || '';

        // If no sizes defined, delete all variants for this product
        if (definedSizes.length === 0) {
          for (const variant of productVariants) {
            await storage.deleteProductVariant(variant.id);
            deletedCount++;
            deletedVariants.push({ productName: product.name, size: variant.size });
          }
          continue;
        }

        // Delete variants with sizes not in defined sizes
        for (const variant of productVariants) {
          if (variant.size && !definedSizes.includes(variant.size)) {
            await storage.deleteProductVariant(variant.id);
            deletedCount++;
            deletedVariants.push({ productName: product.name, size: variant.size });
          }
        }

        // Create missing variants for defined sizes
        for (const size of definedSizes) {
          if (colors.length > 0) {
            for (const color of colors) {
              const exists = productVariants.some(v => v.size === size && v.color === color.name);
              if (!exists) {
                const variantSku = baseSku ? `${baseSku}-${size}` : null;
                await storage.createProductVariant({
                  productId: product.id,
                  size: size,
                  color: color.name,
                  sku: variantSku,
                  stock: 0,
                  price: product.basePrice,
                });
                createdCount++;
                createdVariants.push({ productName: product.name, size, sku: variantSku });
              }
            }
          } else {
            const exists = productVariants.some(v => v.size === size);
            if (!exists) {
              const variantSku = baseSku ? `${baseSku}-${size}` : null;
              await storage.createProductVariant({
                productId: product.id,
                size: size,
                color: null,
                sku: variantSku,
                stock: 0,
                price: product.basePrice,
              });
              createdCount++;
              createdVariants.push({ productName: product.name, size, sku: variantSku });
            }
          }
        }
      }

      let message = '';
      if (createdCount > 0 && deletedCount > 0) {
        message = `${createdCount} varyant oluşturuldu, ${deletedCount} varyant silindi`;
      } else if (createdCount > 0) {
        message = `${createdCount} eksik varyant oluşturuldu`;
      } else if (deletedCount > 0) {
        message = `${deletedCount} fazla varyant silindi`;
      } else {
        message = 'Tüm varyantlar senkronize, değişiklik yok';
      }

      res.json({
        success: true,
        createdCount,
        deletedCount,
        createdVariants,
        deletedVariants,
        message,
      });
    } catch (error) {
      console.error('Fix variants error:', error);
      res.status(500).json({ error: "Failed to fix missing variants" });
    }
  });

  // Order Management Routes (enhanced)
  app.get("/api/admin/orders/:id/notes", requireAdmin, async (req, res) => {
    try {
      const notes = await storage.getOrderNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order notes" });
    }
  });

  app.post("/api/admin/orders/:id/notes", requireAdmin, async (req, res) => {
    try {
      const note = await storage.createOrderNote({
        orderId: req.params.id,
        authorId: req.session.adminId,
        content: req.body.content,
        isPrivate: req.body.isInternal !== false,
      });
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order note" });
    }
  });

  app.put("/api/admin/orders/:id/tracking", requireAdmin, async (req, res) => {
    try {
      const { trackingNumber, trackingUrl, shippingCarrier } = req.body;
      const order = await storage.updateOrderTracking(req.params.id, {
        trackingNumber,
        trackingUrl,
        shippingCarrier,
      });
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tracking" });
    }
  });

  app.put("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Order cancellation with stock restoration
  app.post("/api/admin/orders/:id/cancel", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // Get order items to restore stock
      const orderItems = await storage.getOrderItems(order.id);
      
      // Restore stock for each variant
      for (const item of orderItems) {
        if (item.variantId) {
          const variant = await storage.getProductVariant(item.variantId);
          if (variant) {
            const newStock = variant.stock + item.quantity;
            await storage.updateProductVariant(variant.id, { stock: newStock });
            await storage.createStockAdjustment({
              variantId: variant.id,
              previousStock: variant.stock,
              newStock: newStock,
              adjustmentType: 'return',
              reason: `Sipariş iptali: ${order.orderNumber}`,
            });
          }
        }
      }

      // Update order status to cancelled
      const updatedOrder = await storage.updateOrder(req.params.id, { 
        status: 'cancelled',
        paymentStatus: 'refunded'
      });

      // Add cancellation note
      await storage.createOrderNote({
        orderId: req.params.id,
        authorType: 'admin',
        noteType: 'status_change',
        content: `Sipariş iptal edildi. Sebep: ${req.body.reason || 'Belirtilmedi'}`,
        isPrivate: false,
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Order cancellation error:', error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  // User order stats for detail modal
  app.get("/api/admin/users/:id/stats", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const stats = await storage.getUserOrderStats(user.email);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Influencer coupons routes
  app.get("/api/admin/influencer-coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getInfluencerCoupons();
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch influencer coupons" });
    }
  });

  app.post("/api/admin/influencer-coupons/:id/pay", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.markInfluencerPaid(req.params.id);
      if (!coupon) return res.status(404).json({ error: "Coupon not found" });
      res.json(coupon);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark as paid" });
    }
  });

  // Bulk add influencers
  app.post("/api/admin/influencer-coupons/bulk", requireAdmin, async (req, res) => {
    try {
      const { influencers } = req.body;
      if (!Array.isArray(influencers) || influencers.length === 0) {
        return res.status(400).json({ error: "No influencers provided" });
      }

      const results = [];
      for (const inf of influencers) {
        try {
          const coupon = await storage.createCoupon({
            code: inf.code.toUpperCase(),
            description: `${inf.name || inf.code} - Influencer Kodu`,
            discountType: 'percentage',
            discountValue: String(inf.customerDiscount || 10),
            isActive: true,
            isInfluencerCode: true,
            influencerName: inf.name || inf.code,
            influencerInstagram: inf.instagram || null,
            commissionType: 'percentage',
            commissionValue: String(inf.commissionPercent || 5),
          });
          results.push({ code: inf.code, success: true, id: coupon.id });
        } catch (err: any) {
          results.push({ code: inf.code, success: false, error: err.message });
        }
      }

      res.json({ results, success: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length });
    } catch (error) {
      console.error('Bulk influencer add error:', error);
      res.status(500).json({ error: "Failed to add influencers" });
    }
  });

  // Influencer analytics - monthly usage
  app.get("/api/admin/influencer-analytics", requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate, couponId } = req.query;
      
      // Get all influencer coupons with their redemptions
      const influencerCoupons = await storage.getInfluencerCoupons();
      
      // Get redemption details with order info
      const redemptionsQuery = await db.select({
        redemption: couponRedemptions,
        order: orders,
        coupon: coupons,
      })
      .from(couponRedemptions)
      .leftJoin(orders, eq(couponRedemptions.orderId, orders.id))
      .leftJoin(coupons, eq(couponRedemptions.couponId, coupons.id))
      .where(eq(coupons.isInfluencerCode, true))
      .orderBy(desc(couponRedemptions.createdAt));

      // Filter by date if provided
      let filteredRedemptions = redemptionsQuery;
      if (startDate) {
        const start = new Date(startDate as string);
        filteredRedemptions = filteredRedemptions.filter(r => new Date(r.redemption.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filteredRedemptions = filteredRedemptions.filter(r => new Date(r.redemption.createdAt) <= end);
      }
      if (couponId) {
        filteredRedemptions = filteredRedemptions.filter(r => r.coupon?.id === couponId);
      }

      // Group by month
      const monthlyData: Record<string, { month: string; count: number; revenue: number; commission: number }> = {};
      
      for (const r of filteredRedemptions) {
        const date = new Date(r.redemption.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, count: 0, revenue: 0, commission: 0 };
        }
        
        monthlyData[monthKey].count += 1;
        monthlyData[monthKey].revenue += parseFloat(r.order?.total || '0');
        
        // Calculate commission
        const coupon = r.coupon;
        if (coupon && coupon.commissionType === 'percentage') {
          monthlyData[monthKey].commission += (parseFloat(r.order?.total || '0') * parseFloat(coupon.commissionValue || '0')) / 100;
        } else if (coupon && coupon.commissionType === 'per_use') {
          monthlyData[monthKey].commission += parseFloat(coupon.commissionValue || '0');
        }
      }

      // Convert to array and sort
      const monthlyArray = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

      res.json({
        influencers: influencerCoupons,
        monthlyData: monthlyArray,
        redemptions: filteredRedemptions.map(r => ({
          id: r.redemption.id,
          couponId: r.redemption.couponId,
          couponCode: r.coupon?.code,
          influencerName: r.coupon?.influencerName,
          orderId: r.order?.id,
          orderNumber: r.order?.orderNumber,
          orderTotal: r.order?.total,
          discountAmount: r.redemption.discountAmount,
          createdAt: r.redemption.createdAt,
        })),
        totals: {
          totalRedemptions: filteredRedemptions.length,
          totalRevenue: filteredRedemptions.reduce((sum, r) => sum + parseFloat(r.order?.total || '0'), 0),
          totalCommission: Object.values(monthlyData).reduce((sum, m) => sum + m.commission, 0),
        },
      });
    } catch (error) {
      console.error('Influencer analytics error:', error);
      res.status(500).json({ error: "Failed to fetch influencer analytics" });
    }
  });

  // Admin credentials update route
  app.post("/api/admin/update-credentials", requireAdmin, async (req, res) => {
    try {
      const { newUsername, newPassword } = req.body;
      
      if (!newUsername || !newPassword) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Get current admin and update
      const admin = await storage.getAdminUser(req.session.adminId!);
      if (!admin) return res.status(404).json({ error: "Admin not found" });

      await storage.updateAdminUser(admin.id, {
        username: newUsername,
        password: hashedPassword,
      });

      res.json({ success: true, message: "Credentials updated" });
    } catch (error) {
      console.error('Credentials update error:', error);
      res.status(500).json({ error: "Failed to update credentials" });
    }
  });

  // Campaign Routes
  app.get("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create campaign" });
    }
  });

  app.put("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/admin/campaigns/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  app.get("/api/admin/campaigns/:id/emails", requireAdmin, async (req, res) => {
    try {
      const emails = await storage.getEmailJobsByCampaign(req.params.id);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign emails" });
    }
  });

  app.get("/api/admin/email-recipients", requireAdmin, async (req, res) => {
    try {
      const segment = (req.query.segment as 'all' | 'active' | 'new') || 'all';
      const recipients = await storage.getEmailsForBulkSend(segment);
      res.json(recipients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email recipients" });
    }
  });

  // Site Settings Routes
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      // Mask password for security
      if (settings.smtp_pass) {
        settings.smtp_pass = '••••••••';
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = req.body;
      // Don't update password if it's masked
      if (settings.smtp_pass === '••••••••') {
        delete settings.smtp_pass;
      }
      await storage.setSiteSettings(settings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/admin/settings/test-email", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      const result = await sendTestEmail(email);
      if (result.success) {
        res.json({ success: true, message: "Test e-postası gönderildi" });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Test e-postası gönderilemedi" });
    }
  });

  // Abandoned Cart Reminder - Get users with cart items
  app.get("/api/admin/abandoned-carts", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersWithCartItems();
      res.json(users);
    } catch (error) {
      console.error('[Admin] Abandoned carts error:', error);
      res.status(500).json({ error: "Sepet bilgileri alınamadı" });
    }
  });

  // Send cart reminder email to a specific user
  app.post("/api/admin/abandoned-carts/:userId/remind", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Kullanıcının sepetinde ürün yok" });
      }

      // Get product details for cart items
      const cartItemsWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          const variant = item.variantId ? await storage.getProductVariant(item.variantId) : null;
          // Use variant's productId if available to ensure consistency
          const actualProductId = variant?.productId || item.productId;
          const product = await storage.getProduct(actualProductId);
          return {
            productName: product?.name || 'Ürün',
            variantDetails: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : '',
            price: product?.basePrice || '0',
            quantity: item.quantity,
          };
        })
      );

      const cartTotal = cartItemsWithDetails.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      const result = await sendAbandonedCartEmail(
        user.email,
        user.firstName || 'Değerli Müşterimiz',
        cartItemsWithDetails,
        cartTotal
      );

      if (result.success) {
        res.json({ success: true, message: "Sepet hatırlatma e-postası gönderildi" });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      console.error('[Admin] Cart reminder error:', error);
      res.status(500).json({ error: error.message || "E-posta gönderilemedi" });
    }
  });

  // Send cart reminder to all users with items in cart
  app.post("/api/admin/abandoned-carts/remind-all", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersWithCartItems();
      
      if (users.length === 0) {
        return res.json({ success: true, sent: 0, message: "Sepetinde ürün olan kullanıcı yok" });
      }

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const cartItems = await storage.getCartItems(user.id);
          
          const cartItemsWithDetails = await Promise.all(
            cartItems.map(async (item) => {
              const variant = item.variantId ? await storage.getProductVariant(item.variantId) : null;
              // Use variant's productId if available to ensure consistency
              const actualProductId = variant?.productId || item.productId;
              const product = await storage.getProduct(actualProductId);
              return {
                productName: product?.name || 'Ürün',
                variantDetails: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : '',
                price: product?.basePrice || '0',
                quantity: item.quantity,
              };
            })
          );

          const cartTotal = cartItemsWithDetails.reduce(
            (sum, item) => sum + parseFloat(item.price) * item.quantity,
            0
          );

          const result = await sendAbandonedCartEmail(
            user.email,
            user.firstName || 'Değerli Müşterimiz',
            cartItemsWithDetails,
            cartTotal
          );

          if (result.success) {
            sent++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`[Admin] Failed to send cart reminder to ${user.email}:`, err);
          failed++;
        }
      }

      res.json({ 
        success: true, 
        sent, 
        failed, 
        message: `${sent} kullanıcıya e-posta gönderildi${failed > 0 ? `, ${failed} başarısız` : ''}` 
      });
    } catch (error: any) {
      console.error('[Admin] Bulk cart reminder error:', error);
      res.status(500).json({ error: error.message || "E-postalar gönderilemedi" });
    }
  });

  // Password Reset Routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists
        return res.json({ success: true, message: "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi." });
      }
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.createPasswordResetToken(user.id, token, expiresAt);
      await sendPasswordResetEmail(user, token);
      
      res.json({ success: true, message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." });
    } catch (error) {
      console.error('[Auth] Forgot password error:', error);
      res.status(500).json({ error: "Şifre sıfırlama işlemi başarısız" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token ve yeni şifre gerekli" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Geçersiz veya süresi dolmuş bağlantı" });
      }
      
      if (resetToken.usedAt) {
        return res.status(400).json({ error: "Bu bağlantı zaten kullanılmış" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Bağlantının süresi dolmuş" });
      }
      
      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);
      
      res.json({ success: true, message: "Şifreniz başarıyla güncellendi" });
    } catch (error) {
      console.error('[Auth] Reset password error:', error);
      res.status(500).json({ error: "Şifre sıfırlama işlemi başarısız" });
    }
  });

  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        return res.json({ valid: false });
      }
      
      const user = await storage.getUser(resetToken.userId);
      res.json({ valid: true, email: user?.email || '' });
    } catch (error) {
      res.json({ valid: false });
    }
  });

  // Send shipping notification email when status changes to shipped
  app.post("/api/admin/orders/:id/send-shipping-email", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
      
      const result = await sendShippingNotificationEmail(order);
      if (result.success) {
        res.json({ success: true, message: "Kargo bildirimi gönderildi" });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "E-posta gönderilemedi" });
    }
  });

  // Send invoice to BizimHesap manually
  app.post("/api/admin/orders/:id/send-invoice", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
      
      const orderItems = await storage.getOrderItems(order.id);
      
      // Fetch variant SKUs for invoice
      const variantSkus = new Map<string, string>();
      for (const item of orderItems) {
        if (item.variantId) {
          const variant = await storage.getProductVariant(item.variantId);
          if (variant?.sku) {
            variantSkus.set(item.variantId, variant.sku);
          }
        }
      }
      
      const result = await sendInvoiceToBizimHesap(order, orderItems, variantSkus);
      
      if (result.success) {
        res.json({ success: true, message: "Fatura BizimHesap'a gönderildi", guid: result.guid, url: result.url });
      } else {
        res.status(400).json({ error: result.error || "Fatura gönderilemedi" });
      }
    } catch (error) {
      console.error('[BizimHesap] Manual invoice error:', error);
      res.status(500).json({ error: "Fatura gönderilemedi" });
    }
  });

  // Send review request email
  app.post("/api/admin/orders/:id/send-review-request", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ error: "Sipariş bulunamadı" });
      
      const items = await storage.getOrderItems(order.id);
      const productNames = items.map(item => item.productName);
      
      const result = await sendReviewRequestEmail(
        order.customerEmail,
        order.customerName,
        order.orderNumber,
        productNames
      );
      
      if (result.success) {
        res.json({ success: true, message: "Değerlendirme talebi gönderildi" });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "E-posta gönderilemedi" });
    }
  });

  // Sitemap XML
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = req.protocol + '://' + req.get('host');
      const products = await storage.getProducts();
      const categories = await storage.getCategories();
      
      const escapeXml = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };
      
      const normalizeUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return baseUrl + (url.startsWith('/') ? url : '/' + url);
      };
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
      
      const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/giris', priority: '0.5', changefreq: 'monthly' },
        { loc: '/kayit', priority: '0.5', changefreq: 'monthly' },
        { loc: '/sepet', priority: '0.6', changefreq: 'weekly' },
      ];
      
      for (const page of staticPages) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(baseUrl + page.loc)}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      }
      
      for (const category of categories) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(baseUrl + '/kategori/' + category.slug)}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
      
      for (const product of products) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(baseUrl + '/urun/' + product.slug)}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.9</priority>\n';
        if (product.images && product.images.length > 0) {
          const imageUrl = normalizeUrl(product.images[0]);
          xml += '    <image:image>\n';
          xml += `      <image:loc>${escapeXml(imageUrl)}</image:loc>\n`;
          xml += `      <image:title>${escapeXml(product.name)}</image:title>\n`;
          xml += '    </image:image>\n';
        }
        xml += '  </url>\n';
      }
      
      xml += '</urlset>';
      
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = req.protocol + '://' + req.get('host');
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /toov-admin/
Disallow: /api/
Disallow: /odeme
Disallow: /hesabim

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Cache invalidation endpoint for admin
  app.post("/api/admin/cache/clear", requireAdmin, (req, res) => {
    cache.clear();
    res.json({ success: true, message: "Cache cleared" });
  });

  app.get("/api/admin/cache/stats", requireAdmin, (req, res) => {
    res.json(cache.getStats());
  });

  // Database Management Endpoints - for clearing specific tables
  app.get("/api/admin/database/stats", requireAdmin, async (req, res) => {
    try {
      const [ordersCount, cartItemsCount, pendingPaymentsCount, reviewsCount, couponUsageCount] = await Promise.all([
        storage.getOrdersCount(),
        storage.getCartItemsCount(),
        storage.getPendingPaymentsCount(),
        storage.getReviewsCount(),
        storage.getCouponUsageCount(),
      ]);
      
      res.json({
        orders: ordersCount,
        cartItems: cartItemsCount,
        pendingPayments: pendingPaymentsCount,
        reviews: reviewsCount,
        couponUsage: couponUsageCount,
      });
    } catch (error) {
      console.error('[Database] Stats error:', error);
      res.status(500).json({ error: "Veritabanı istatistikleri alınamadı" });
    }
  });

  app.post("/api/admin/database/clear/:table", requireAdmin, async (req: Request, res) => {
    try {
      const { table } = req.params;
      const { confirmCode } = req.body;
      
      // Require confirmation code
      if (confirmCode !== 'SIFIRLA') {
        return res.status(400).json({ error: "Onay kodu hatalı. 'SIFIRLA' yazmalısınız." });
      }
      
      // List of safe-to-clear tables (NOT users, products, product_variants, categories)
      const allowedTables = ['orders', 'order_items', 'cart_items', 'pending_payments', 'reviews', 'review_requests', 'coupon_usage', 'stock_adjustments'];
      
      if (!allowedTables.includes(table)) {
        return res.status(403).json({ error: "Bu tablo silinemez" });
      }
      
      let deletedCount = 0;
      
      switch (table) {
        case 'orders':
          // First delete order items, then orders
          await storage.clearOrderItems();
          deletedCount = await storage.clearOrders();
          break;
        case 'order_items':
          deletedCount = await storage.clearOrderItems();
          break;
        case 'cart_items':
          deletedCount = await storage.clearAllCartItems();
          break;
        case 'pending_payments':
          deletedCount = await storage.clearPendingPayments();
          break;
        case 'reviews':
          deletedCount = await storage.clearReviews();
          break;
        case 'review_requests':
          deletedCount = await storage.clearReviewRequests();
          break;
        case 'coupon_usage':
          deletedCount = await storage.clearCouponUsage();
          // Also reset coupon usage counts
          await storage.resetCouponUsageCounts();
          break;
        case 'stock_adjustments':
          deletedCount = await storage.clearStockAdjustments();
          break;
        default:
          return res.status(400).json({ error: "Geçersiz tablo adı" });
      }
      
      console.log(`[Database] Table ${table} cleared by admin. ${deletedCount} records deleted.`);
      res.json({ success: true, table, deletedCount });
    } catch (error) {
      console.error('[Database] Clear error:', error);
      res.status(500).json({ error: "Tablo temizlenemedi" });
    }
  });

  // Clear all sales data (orders, order_items, pending_payments, coupon_usage)
  app.post("/api/admin/database/clear-all-sales", requireAdmin, async (req: Request, res) => {
    try {
      const { confirmCode } = req.body;
      
      if (confirmCode !== 'TUM_SATISLARI_SIL') {
        return res.status(400).json({ error: "Onay kodu hatalı. 'TUM_SATISLARI_SIL' yazmalısınız." });
      }
      
      // Clear in order of dependencies
      await storage.clearOrderItems();
      await storage.clearOrders();
      await storage.clearPendingPayments();
      await storage.clearCouponUsage();
      await storage.resetCouponUsageCounts();
      await storage.clearAllCartItems();
      
      console.log('[Database] All sales data cleared by admin');
      res.json({ success: true, message: "Tüm satış verileri silindi" });
    } catch (error) {
      console.error('[Database] Clear all sales error:', error);
      res.status(500).json({ error: "Satış verileri silinemedi" });
    }
  });

  return httpServer;
}
