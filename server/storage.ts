import { db } from "./db";
import { 
  adminUsers, 
  categories, 
  products, 
  productVariants, 
  cartItems,
  orders,
  orderItems,
  users,
  woocommerceSettings,
  woocommerceSyncLogs,
  favorites,
  productReviews,
  coupons,
  couponRedemptions,
  orderNotes,
  stockAdjustments,
  lowStockAlerts,
  campaigns,
  emailJobs,
  type AdminUser,
  type InsertAdminUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type User,
  type InsertUser,
  type WoocommerceSettings,
  type InsertWoocommerceSettings,
  type WoocommerceSyncLog,
  type Favorite,
  type InsertFavorite,
  type ProductReview,
  type InsertProductReview,
  type Coupon,
  type InsertCoupon,
  type CouponRedemption,
  type OrderNote,
  type InsertOrderNote,
  type StockAdjustment,
  type LowStockAlert,
  type Campaign,
  type InsertCampaign,
  type EmailJob
} from "@shared/schema";
import { eq, and, desc, asc, sql, ilike, gte, lte, between, inArray } from "drizzle-orm";

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
}

export interface IStorage {
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(search?: string): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  getAdminStats(): Promise<AdminStats>;
  getAllProducts(): Promise<Product[]>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  getProducts(filters?: { 
    categoryId?: string; 
    isFeatured?: boolean; 
    isNew?: boolean; 
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Favorites
  getFavorites(userId: string): Promise<Favorite[]>;
  getFavoriteProducts(userId: string): Promise<Product[]>;
  isFavorite(userId: string, productId: string): Promise<boolean>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, productId: string): Promise<void>;
  getUserFavoriteProductIds(userId: string): Promise<string[]>;

  // Reviews
  getProductReviews(productId: string): Promise<(ProductReview & { user: { firstName: string | null; lastName: string | null } })[]>;
  getProductAverageRating(productId: string): Promise<{ average: number; count: number }>;
  createReview(review: InsertProductReview): Promise<ProductReview>;
  deleteReview(id: string): Promise<void>;
  getUserReview(userId: string, productId: string): Promise<ProductReview | undefined>;

  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getProductVariant(id: string): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: string): Promise<void>;

  getCartItems(sessionId: string): Promise<CartItem[]>;
  getCartItem(id: string): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(sessionId: string): Promise<void>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
}

export class DbStorage implements IStorage {
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [newUser] = await db.insert(adminUsers).values(user).returning();
    return newUser;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(search?: string): Promise<User[]> {
    if (search) {
      return db.select().from(users).where(
        sql`${users.email} ILIKE ${'%' + search + '%'} OR ${users.firstName} ILIKE ${'%' + search + '%'} OR ${users.lastName} ILIKE ${'%' + search + '%'}`
      ).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAdminStats(): Promise<AdminStats> {
    const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'pending'));
    const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(total AS DECIMAL)), 0)` }).from(orders);
    
    return {
      totalProducts: Number(productCount.count),
      totalCategories: Number(categoryCount.count),
      totalOrders: Number(orderCount.count),
      totalUsers: Number(userCount.count),
      totalRevenue: Number(revenue.total),
      pendingOrders: Number(pendingCount.count),
    };
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProducts(filters?: { 
    categoryId?: string; 
    isFeatured?: boolean; 
    isNew?: boolean; 
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    colors?: string[];
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.isFeatured));
    }
    if (filters?.isNew !== undefined) {
      conditions.push(eq(products.isNew, filters.isNew));
    }
    if (filters?.search) {
      conditions.push(ilike(products.name, `%${filters.search}%`));
    }
    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.basePrice, String(filters.minPrice)));
    }
    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.basePrice, String(filters.maxPrice)));
    }

    let query = db.select().from(products).where(and(...conditions));

    // Apply sorting
    switch (filters?.sort) {
      case 'price_asc':
        query = query.orderBy(asc(products.basePrice));
        break;
      case 'price_desc':
        query = query.orderBy(desc(products.basePrice));
        break;
      case 'newest':
        query = query.orderBy(desc(products.createdAt));
        break;
      case 'popular':
        query = query.orderBy(desc(products.isFeatured), desc(products.createdAt));
        break;
      default:
        query = query.orderBy(desc(products.createdAt));
    }

    return query;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return db.select().from(productVariants).where(eq(productVariants.productId, productId));
  }

  async getProductVariant(id: string): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return variant;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async updateProductVariant(id: string, variant: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants).set(variant).where(eq(productVariants.id, id)).returning();
    return updated;
  }

  async deleteProductVariant(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems).where(
      and(
        eq(cartItems.sessionId, item.sessionId),
        eq(cartItems.productId, item.productId),
        item.variantId ? eq(cartItems.variantId, item.variantId) : sql`${cartItems.variantId} IS NULL`
      )
    );

    if (existing.length > 0) {
      const newQuantity = (existing[0].quantity || 0) + (item.quantity || 1);
      const [updated] = await db.update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(item).returning();
    return newItem;
  }

  // WooCommerce Settings
  async getWoocommerceSettings(): Promise<WoocommerceSettings | undefined> {
    const [settings] = await db.select().from(woocommerceSettings).limit(1);
    return settings;
  }

  async saveWoocommerceSettings(settings: InsertWoocommerceSettings): Promise<WoocommerceSettings> {
    const existing = await this.getWoocommerceSettings();
    if (existing) {
      const [updated] = await db.update(woocommerceSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(woocommerceSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [newSettings] = await db.insert(woocommerceSettings).values(settings).returning();
    return newSettings;
  }

  async updateWoocommerceLastSync(): Promise<void> {
    const existing = await this.getWoocommerceSettings();
    if (existing) {
      await db.update(woocommerceSettings)
        .set({ lastSync: new Date() })
        .where(eq(woocommerceSettings.id, existing.id));
    }
  }

  async deleteWoocommerceSettings(): Promise<void> {
    await db.delete(woocommerceSettings);
  }

  // WooCommerce Sync Logs
  async getWoocommerceSyncLogs(): Promise<WoocommerceSyncLog[]> {
    return db.select().from(woocommerceSyncLogs).orderBy(desc(woocommerceSyncLogs.startedAt)).limit(10);
  }

  async createWoocommerceSyncLog(status: string): Promise<WoocommerceSyncLog> {
    const [log] = await db.insert(woocommerceSyncLogs).values({ status }).returning();
    return log;
  }

  async updateWoocommerceSyncLog(id: string, data: Partial<WoocommerceSyncLog>): Promise<void> {
    await db.update(woocommerceSyncLogs).set(data).where(eq(woocommerceSyncLogs.id, id));
  }

  async getProductBySlugOrCreate(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getCategoryBySlugOrCreate(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  // Favorites methods
  async getFavorites(userId: string): Promise<Favorite[]> {
    return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }

  async getFavoriteProducts(userId: string): Promise<Product[]> {
    const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
    if (userFavorites.length === 0) return [];
    
    const productIds = userFavorites.map(f => f.productId);
    const result = await db.select().from(products).where(
      and(
        eq(products.isActive, true),
        inArray(products.id, productIds)
      )
    );
    return result;
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const [fav] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.productId, productId))
    );
    return !!fav;
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const existing = await db.select().from(favorites).where(
      and(eq(favorites.userId, favorite.userId), eq(favorites.productId, favorite.productId))
    );
    if (existing.length > 0) {
      return existing[0];
    }
    const [newFav] = await db.insert(favorites).values(favorite).returning();
    return newFav;
  }

  async removeFavorite(userId: string, productId: string): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.productId, productId))
    );
  }

  async getUserFavoriteProductIds(userId: string): Promise<string[]> {
    const userFavorites = await db.select({ productId: favorites.productId }).from(favorites).where(eq(favorites.userId, userId));
    return userFavorites.map(f => f.productId);
  }

  // Reviews methods
  async getProductReviews(productId: string): Promise<(ProductReview & { user: { firstName: string | null; lastName: string | null } })[]> {
    const reviews = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        userId: productReviews.userId,
        rating: productReviews.rating,
        title: productReviews.title,
        content: productReviews.content,
        isApproved: productReviews.isApproved,
        createdAt: productReviews.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(productReviews)
      .leftJoin(users, eq(productReviews.userId, users.id))
      .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)))
      .orderBy(desc(productReviews.createdAt));

    return reviews.map(r => ({
      id: r.id,
      productId: r.productId,
      userId: r.userId,
      rating: r.rating,
      title: r.title,
      content: r.content,
      isApproved: r.isApproved,
      createdAt: r.createdAt,
      user: {
        firstName: r.userFirstName,
        lastName: r.userLastName,
      }
    }));
  }

  async getProductAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const result = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(${productReviews.rating}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(productReviews)
      .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)));

    return {
      average: Number(result[0]?.avgRating || 0),
      count: Number(result[0]?.count || 0),
    };
  }

  async createReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db.insert(productReviews).values(review).returning();
    return newReview;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(productReviews).where(eq(productReviews.id, id));
  }

  async getUserReview(userId: string, productId: string): Promise<ProductReview | undefined> {
    const [review] = await db.select().from(productReviews).where(
      and(eq(productReviews.userId, userId), eq(productReviews.productId, productId))
    );
    return review;
  }

  // Analytics methods
  async getSalesAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
    labels: string[];
    revenue: number[];
    orders: number[];
  }> {
    let interval: string;
    let format: string;
    let limit: number;
    
    switch (period) {
      case 'day':
        interval = '1 day';
        format = 'HH24:00';
        limit = 24;
        break;
      case 'week':
        interval = '7 days';
        format = 'Dy';
        limit = 7;
        break;
      case 'month':
        interval = '30 days';
        format = 'DD Mon';
        limit = 30;
        break;
      case 'year':
        interval = '365 days';
        format = 'Mon';
        limit = 12;
        break;
    }

    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, ${format}) as label,
        COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= NOW() - INTERVAL ${interval}
      GROUP BY TO_CHAR(created_at, ${format}), DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) DESC
      LIMIT ${limit}
    `);

    const rows = (result.rows || []) as any[];
    return {
      labels: rows.map(r => r.label).reverse(),
      revenue: rows.map(r => Number(r.revenue)).reverse(),
      orders: rows.map(r => Number(r.order_count)).reverse(),
    };
  }

  async getBestSellingProducts(limit: number = 10): Promise<{
    product: Product;
    totalSold: number;
    revenue: number;
  }[]> {
    const result = await db.execute(sql`
      SELECT 
        p.*,
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(CAST(oi.subtotal AS DECIMAL)), 0) as revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ${limit}
    `);

    return (result.rows || []).map((r: any) => ({
      product: {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        sku: r.sku,
        categoryId: r.category_id,
        basePrice: r.base_price,
        images: r.images || [],
        availableSizes: r.available_sizes || [],
        availableColors: r.available_colors || [],
        isActive: r.is_active,
        isFeatured: r.is_featured,
        isNew: r.is_new,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
      totalSold: Number(r.total_sold),
      revenue: Number(r.revenue),
    }));
  }

  async getRevenueByPeriod(startDate: Date, endDate: Date): Promise<{
    total: number;
    orderCount: number;
    averageOrderValue: number;
  }> {
    const result = await db.execute(sql`
      SELECT 
        COALESCE(SUM(CAST(total AS DECIMAL)), 0) as total_revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at BETWEEN ${startDate} AND ${endDate}
    `);

    const row = (result.rows || [])[0] as any;
    const total = Number(row?.total_revenue || 0);
    const orderCount = Number(row?.order_count || 0);
    return {
      total,
      orderCount,
      averageOrderValue: orderCount > 0 ? total / orderCount : 0,
    };
  }

  async getPeriodComparison(currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date): Promise<{
    current: { revenue: number; orders: number };
    previous: { revenue: number; orders: number };
    revenueChange: number;
    ordersChange: number;
  }> {
    const current = await this.getRevenueByPeriod(currentStart, currentEnd);
    const previous = await this.getRevenueByPeriod(previousStart, previousEnd);

    return {
      current: { revenue: current.total, orders: current.orderCount },
      previous: { revenue: previous.total, orders: previous.orderCount },
      revenueChange: previous.total > 0 ? ((current.total - previous.total) / previous.total) * 100 : 0,
      ordersChange: previous.orderCount > 0 ? ((current.orderCount - previous.orderCount) / previous.orderCount) * 100 : 0,
    };
  }

  // Coupon methods
  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(coupons).orderBy(desc(coupons.createdAt));
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code.toUpperCase()));
    return coupon;
  }

  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [newCoupon] = await db.insert(coupons).values({
      ...coupon,
      code: coupon.code.toUpperCase(),
    }).returning();
    return newCoupon;
  }

  async updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const updateData = coupon.code ? { ...coupon, code: coupon.code.toUpperCase(), updatedAt: new Date() } : { ...coupon, updatedAt: new Date() };
    const [updated] = await db.update(coupons).set(updateData).where(eq(coupons.id, id)).returning();
    return updated;
  }

  async deleteCoupon(id: string): Promise<void> {
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async incrementCouponUsage(id: string): Promise<void> {
    await db.execute(sql`UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ${id}`);
  }

  async validateCoupon(code: string, orderTotal: number, userId?: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) return { valid: false, error: 'Kupon kodu bulunamadı' };
    if (!coupon.isActive) return { valid: false, error: 'Bu kupon aktif değil' };
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return { valid: false, error: 'Kupon henüz geçerli değil' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, error: 'Kuponun süresi dolmuş' };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return { valid: false, error: 'Kupon kullanım limiti dolmuş' };
    if (coupon.minOrderAmount && orderTotal < parseFloat(coupon.minOrderAmount)) {
      return { valid: false, error: `Minimum sipariş tutarı: ${coupon.minOrderAmount} TL` };
    }

    if (userId && coupon.perUserLimit) {
      const userRedemptions = await db.select().from(couponRedemptions).where(
        and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, userId))
      );
      if (userRedemptions.length >= coupon.perUserLimit) {
        return { valid: false, error: 'Bu kuponu daha fazla kullanamazsınız' };
      }
    }

    return { valid: true, coupon };
  }

  async redeemCoupon(couponId: string, orderId: string, userId: string | null, discountAmount: number): Promise<void> {
    await db.insert(couponRedemptions).values({
      couponId,
      orderId,
      userId,
      discountAmount: String(discountAmount),
    });
    await this.incrementCouponUsage(couponId);
  }

  // Order notes methods
  async getOrderNotes(orderId: string): Promise<OrderNote[]> {
    return db.select().from(orderNotes).where(eq(orderNotes.orderId, orderId)).orderBy(desc(orderNotes.createdAt));
  }

  async createOrderNote(note: InsertOrderNote): Promise<OrderNote> {
    const [newNote] = await db.insert(orderNotes).values(note).returning();
    return newNote;
  }

  // Order tracking methods
  async updateOrderTracking(id: string, data: { trackingNumber?: string; trackingUrl?: string; shippingCarrier?: string }): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Stock management methods
  async getAllVariantsWithProducts(): Promise<(ProductVariant & { product: Product })[]> {
    const result = await db
      .select()
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .orderBy(products.name, productVariants.size);

    return result.map(r => ({
      ...r.product_variants,
      product: r.products!,
    }));
  }

  async getLowStockVariants(threshold: number = 5): Promise<(ProductVariant & { product: Product })[]> {
    const result = await db
      .select()
      .from(productVariants)
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(lte(productVariants.stock, threshold))
      .orderBy(asc(productVariants.stock));

    return result.map(r => ({
      ...r.product_variants,
      product: r.products!,
    }));
  }

  async bulkUpdateStock(updates: { variantId: string; stock: number; reason?: string; authorId?: string }[]): Promise<void> {
    for (const update of updates) {
      const variant = await this.getProductVariant(update.variantId);
      if (variant) {
        await db.insert(stockAdjustments).values({
          variantId: update.variantId,
          previousStock: variant.stock,
          newStock: update.stock,
          adjustmentType: 'manual',
          reason: update.reason || 'Toplu stok güncellemesi',
          authorId: update.authorId,
        });
        await db.update(productVariants).set({ stock: update.stock }).where(eq(productVariants.id, update.variantId));
      }
    }
  }

  async getStockAdjustments(variantId?: string): Promise<StockAdjustment[]> {
    if (variantId) {
      return db.select().from(stockAdjustments).where(eq(stockAdjustments.variantId, variantId)).orderBy(desc(stockAdjustments.createdAt));
    }
    return db.select().from(stockAdjustments).orderBy(desc(stockAdjustments.createdAt)).limit(100);
  }

  // Campaign methods
  async getCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [updated] = await db.update(campaigns).set({ ...campaign, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // Email job methods
  async createEmailJobs(jobs: { campaignId: string; recipientEmail: string; recipientName?: string }[]): Promise<void> {
    if (jobs.length > 0) {
      await db.insert(emailJobs).values(jobs);
    }
  }

  async getEmailJobsByCampaign(campaignId: string): Promise<EmailJob[]> {
    return db.select().from(emailJobs).where(eq(emailJobs.campaignId, campaignId)).orderBy(desc(emailJobs.createdAt));
  }

  async updateEmailJob(id: string, data: Partial<EmailJob>): Promise<void> {
    await db.update(emailJobs).set(data).where(eq(emailJobs.id, id));
  }

  async getEmailsForBulkSend(segment: 'all' | 'active' | 'new'): Promise<{ email: string; name: string }[]> {
    let query;
    switch (segment) {
      case 'new':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = db.select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(gte(users.createdAt, thirtyDaysAgo));
        break;
      case 'active':
        query = db.select({ email: orders.customerEmail, name: orders.customerName })
          .from(orders)
          .groupBy(orders.customerEmail, orders.customerName);
        break;
      default:
        query = db.select({ email: users.email, firstName: users.firstName, lastName: users.lastName }).from(users);
    }

    const result = await query;
    return result.map((r: any) => ({
      email: r.email,
      name: r.name || `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Müşteri',
    }));
  }
}

export const storage = new DbStorage();
