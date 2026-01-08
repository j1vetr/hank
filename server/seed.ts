import { db } from "./db";
import { adminUsers, categories, products, productVariants } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [admin] = await db.insert(adminUsers).values({
      username: "admin",
      password: hashedPassword,
    }).returning();
    console.log("✓ Admin user created:", admin.username);

    // Create categories
    const categoryData = [
      { name: "Eşofman", slug: "esofman", displayOrder: 1, image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=800&fit=crop" },
      { name: "Şalvar & Pantolon", slug: "salvar-pantolon", displayOrder: 2, image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop" },
      { name: "Sıfır Kol & Atlet", slug: "sifir-kol-atlet", displayOrder: 3, image: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop" },
      { name: "Şort", slug: "sort", displayOrder: 4, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop" },
      { name: "T-Shirt", slug: "tshirt", displayOrder: 5, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop" },
    ];

    const createdCategories = await db.insert(categories).values(categoryData).returning();
    console.log("✓ Categories created:", createdCategories.length);

    // Create sample products
    const tshirtCategory = createdCategories.find(c => c.slug === "tshirt");
    const esofmanCategory = createdCategories.find(c => c.slug === "esofman");
    const sortCategory = createdCategories.find(c => c.slug === "sort");
    const atletCategory = createdCategories.find(c => c.slug === "sifir-kol-atlet");

    const sampleProducts = [
      {
        name: "Performance Pro Tişört",
        slug: "performance-pro-tisort",
        description: "Yüksek performanslı antrenman tişörtü. Nefes alabilen kumaş teknolojisi ile ter kontrolü sağlar.",
        categoryId: tshirtCategory?.id,
        basePrice: "599.00",
        images: ["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop"],
        isActive: true,
        isFeatured: true,
        isNew: true,
      },
      {
        name: "Muscle Fit Eşofman Altı",
        slug: "muscle-fit-esofman-alti",
        description: "Kas kesimli eşofman altı. Rahat hareket imkanı ve modern tasarım.",
        categoryId: esofmanCategory?.id,
        basePrice: "899.00",
        images: ["https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=800&fit=crop"],
        isActive: true,
        isFeatured: true,
        isNew: false,
      },
      {
        name: "Training Şort",
        slug: "training-sort",
        description: "Hafif ve esnek antrenman şortu. Hızlı kuruma özelliği.",
        categoryId: sortCategory?.id,
        basePrice: "449.00",
        images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop"],
        isActive: true,
        isFeatured: false,
        isNew: true,
      },
      {
        name: "Essential Tank Top",
        slug: "essential-tank-top",
        description: "Temel atlet. Premium kalite pamuklu kumaş.",
        categoryId: atletCategory?.id,
        basePrice: "399.00",
        images: ["https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop"],
        isActive: true,
        isFeatured: true,
        isNew: false,
      },
      {
        name: "Compression Tişört",
        slug: "compression-tisort",
        description: "Sıkı kesimli kompresyon tişörtü. Kas desteği ve performans artışı.",
        categoryId: tshirtCategory?.id,
        basePrice: "649.00",
        images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop"],
        isActive: true,
        isFeatured: false,
        isNew: false,
      },
    ];

    const createdProducts = await db.insert(products).values(sampleProducts).returning();
    console.log("✓ Products created:", createdProducts.length);

    // Create variants for first product
    const firstProduct = createdProducts[0];
    const variants = [
      { productId: firstProduct.id, size: "S", color: "Siyah", colorHex: "#000000", price: "599.00", stock: 15, sku: "PRF-BLK-S" },
      { productId: firstProduct.id, size: "M", color: "Siyah", colorHex: "#000000", price: "599.00", stock: 20, sku: "PRF-BLK-M" },
      { productId: firstProduct.id, size: "L", color: "Siyah", colorHex: "#000000", price: "599.00", stock: 18, sku: "PRF-BLK-L" },
      { productId: firstProduct.id, size: "XL", color: "Siyah", colorHex: "#000000", price: "599.00", stock: 12, sku: "PRF-BLK-XL" },
      { productId: firstProduct.id, size: "S", color: "Beyaz", colorHex: "#FFFFFF", price: "599.00", stock: 10, sku: "PRF-WHT-S" },
      { productId: firstProduct.id, size: "M", color: "Beyaz", colorHex: "#FFFFFF", price: "599.00", stock: 15, sku: "PRF-WHT-M" },
      { productId: firstProduct.id, size: "L", color: "Beyaz", colorHex: "#FFFFFF", price: "599.00", stock: 12, sku: "PRF-WHT-L" },
    ];

    await db.insert(productVariants).values(variants);
    console.log("✓ Variants created for", firstProduct.name);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nAdmin credentials:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\nLogin at: /toov-admin/login");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
