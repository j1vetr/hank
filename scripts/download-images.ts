import { db } from '../server/db';
import { products, categories } from '../shared/schema';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const UPLOAD_DIR = path.join(process.cwd(), 'client/public/uploads');

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(destPath);
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(destPath);
          downloadImage(redirectUrl, destPath).then(resolve);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        console.log(`Failed to download ${url}: ${response.statusCode}`);
        file.close();
        fs.unlinkSync(destPath);
        resolve(false);
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });
    
    request.on('error', (err) => {
      console.log(`Error downloading ${url}: ${err.message}`);
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      resolve(false);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      resolve(false);
    });
  });
}

async function migrateProductImages() {
  console.log('Starting image migration...');
  
  const productsDir = path.join(UPLOAD_DIR, 'products');
  const categoriesDir = path.join(UPLOAD_DIR, 'categories');
  
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }
  if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir, { recursive: true });
  }
  
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products to process`);
  
  for (const product of allProducts) {
    const images = product.images || [];
    const newImages: string[] = [];
    
    console.log(`Processing product: ${product.name}`);
    
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      
      if (imageUrl.startsWith('/uploads/')) {
        newImages.push(imageUrl);
        continue;
      }
      
      if (!imageUrl.startsWith('http')) {
        newImages.push(imageUrl);
        continue;
      }
      
      const urlPath = new URL(imageUrl).pathname;
      const ext = path.extname(urlPath) || '.jpg';
      const filename = `${product.slug}-${i + 1}-${Date.now()}${ext}`;
      const destPath = path.join(productsDir, filename);
      const relativePath = `/uploads/products/${filename}`;
      
      console.log(`  Downloading: ${imageUrl}`);
      const success = await downloadImage(imageUrl, destPath);
      
      if (success) {
        console.log(`  Saved to: ${relativePath}`);
        newImages.push(relativePath);
      } else {
        console.log(`  Failed, keeping original URL`);
        newImages.push(imageUrl);
      }
    }
    
    if (JSON.stringify(newImages) !== JSON.stringify(images)) {
      await db.update(products).set({ images: newImages }).where(
        (await import('drizzle-orm')).eq(products.id, product.id)
      );
      console.log(`  Updated product images in database`);
    }
  }
  
  const allCategories = await db.select().from(categories);
  console.log(`\nFound ${allCategories.length} categories to process`);
  
  for (const category of allCategories) {
    if (!category.image) continue;
    
    if (category.image.startsWith('/uploads/')) continue;
    if (!category.image.startsWith('http')) continue;
    
    console.log(`Processing category: ${category.name}`);
    
    const urlPath = new URL(category.image).pathname;
    const ext = path.extname(urlPath) || '.jpg';
    const filename = `${category.slug}-${Date.now()}${ext}`;
    const destPath = path.join(categoriesDir, filename);
    const relativePath = `/uploads/categories/${filename}`;
    
    console.log(`  Downloading: ${category.image}`);
    const success = await downloadImage(category.image, destPath);
    
    if (success) {
      console.log(`  Saved to: ${relativePath}`);
      await db.update(categories).set({ image: relativePath }).where(
        (await import('drizzle-orm')).eq(categories.id, category.id)
      );
      console.log(`  Updated category image in database`);
    }
  }
  
  console.log('\nImage migration complete!');
}

migrateProductImages().catch(console.error).finally(() => process.exit(0));
