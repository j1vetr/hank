import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertAdminUserSchema, insertCategorySchema, insertProductSchema, insertProductVariantSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, insertUserSchema } from "@shared/schema";
import "./types";
import { optimizeImage, optimizeImageBuffer, optimizeUploadedFiles } from "./imageOptimizer";
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendShippingNotificationEmail, 
  sendAdminOrderNotificationEmail,
  sendPasswordResetEmail,
  sendReviewRequestEmail,
  sendTestEmail 
} from "./emailService";

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
      const { email, password, firstName, lastName, phone } = req.body;
      
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
      });

      req.session.userId = user.id;
      
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

  app.post("/api/auth/forgot-password", async (req: Request, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "E-posta adresi gerekli" });
      }

      const user = await storage.getUserByEmail(email);
      
      // For security, always return success even if email doesn't exist
      // In a production app, you would send an email here with a reset link
      if (user) {
        // TODO: Implement actual email sending with reset token
        // For now, just log the request
        console.log(`Password reset requested for: ${email}`);
      }
      
      res.json({ success: true, message: "Şifre sıfırlama bağlantısı gönderildi" });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: "İşlem başarısız" });
    }
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
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
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
      const validated = insertCartItemSchema.parse({
        ...req.body,
        sessionId,
      });
      const item = await storage.addToCart(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Failed to add to cart" });
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
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req: Request, res) => {
    try {
      const sessionId = req.sessionID;
      const cartItems = await storage.getCartItems(sessionId);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Generate order number
      const orderNumber = `HNK${Date.now()}`;
      
      const validated = insertOrderSchema.parse({
        ...req.body,
        orderNumber,
      });

      const order = await storage.createOrder(validated);

      // Create order items
      for (const cartItem of cartItems) {
        const product = await storage.getProduct(cartItem.productId);
        const variant = cartItem.variantId 
          ? await storage.getProductVariant(cartItem.variantId)
          : null;

        if (product) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: product.id,
            variantId: variant?.id,
            productName: product.name,
            variantDetails: variant ? `${variant.size || ''} ${variant.color || ''}`.trim() : null,
            price: variant?.price || product.basePrice,
            quantity: cartItem.quantity,
            subtotal: ((parseFloat(variant?.price || product.basePrice) * cartItem.quantity).toFixed(2)),
          });
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
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
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
                  
                  await storage.createProduct({
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
        isInternal: req.body.isInternal !== false,
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
      
      res.json({ valid: true });
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

  return httpServer;
}
