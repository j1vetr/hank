import OpenAI from "openai";
import { db } from "./db";
import { products, productVariants, productAttributes, productEmbeddings, categories, chatSessions, chatMessages } from "@shared/schema";
import { eq, and, sql, ilike, or, inArray } from "drizzle-orm";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

const BLOCKED_WORDS = [
  'amk', 'aq', 'oç', 'piç', 'sik', 'yarrak', 'göt', 'meme', 'am', 'orospu', 'pezevenk', 'ibne', 'puşt',
  'bok', 'siktir', 'gerizekalı', 'salak', 'aptal', 'mal', 'dangalak', 'hıyar', 'öküz', 'eşek'
];

const COMPETITOR_BRANDS = [
  'gymshark', 'nike', 'adidas', 'puma', 'under armour', 'underarmour', 'reebok', 'new balance',
  'fila', 'asics', 'decathlon', 'defacto', 'koton', 'lc waikiki', 'lcw', 'mavi', 'collezione',
  'jack jones', 'zara', 'hm', 'h&m', 'bershka', 'pull bear', 'stradivarius', 'mango',
  'alphalete', 'vanquish', 'myprotein', 'young la', 'cbum', 'rawgear'
];

function containsBlockedContent(message: string): { blocked: boolean; reason?: string } {
  const lowerMsg = message.toLowerCase().replace(/[^a-zçğıöşü0-9\s]/gi, '');
  
  for (const word of BLOCKED_WORDS) {
    if (lowerMsg.includes(word)) {
      return { blocked: true, reason: 'inappropriate' };
    }
  }
  
  for (const brand of COMPETITOR_BRANDS) {
    if (lowerMsg.includes(brand.toLowerCase())) {
      return { blocked: true, reason: 'competitor' };
    }
  }
  
  return { blocked: false };
}

function checkRateLimit(sessionToken: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionToken);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(sessionToken, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

export function isChatbotAvailable(): boolean {
  return !!OPENAI_API_KEY && !!openai;
}

interface ProductWithDetails {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  images: string[];
  slug: string;
  categoryName: string | null;
  attributes: {
    productType: string | null;
    fit: string | null;
    material: string | null;
    usage: string[];
    season: string | null;
    features: string[];
    targetGender: string | null;
    priceRange: string | null;
  } | null;
  variants: Array<{
    id: string;
    size: string;
    color: string;
    colorHex: string | null;
    stock: number;
    price: string;
  }>;
}

export async function generateProductEmbedding(productId: string): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      category: true,
    },
  });

  if (!product) {
    throw new Error("Ürün bulunamadı");
  }

  const attrs = await db.query.productAttributes.findFirst({
    where: eq(productAttributes.productId, productId),
  });

  const embeddingText = buildEmbeddingText(product, attrs);

  if (!openai) {
    throw new Error("OpenAI API anahtarı yapılandırılmamış");
  }

  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: embeddingText,
  });

  const embedding = response.data[0].embedding;

  await db.insert(productEmbeddings)
    .values({
      productId,
      embedding,
      embeddingText,
    })
    .onConflictDoUpdate({
      target: productEmbeddings.productId,
      set: {
        embedding,
        embeddingText,
        updatedAt: new Date(),
      },
    });
}

function buildEmbeddingText(product: any, attrs: any): string {
  const parts: string[] = [];

  parts.push(`Ürün: ${product.name}`);
  
  if (product.category?.name) {
    parts.push(`Kategori: ${product.category.name}`);
  }

  if (product.description) {
    const cleanDesc = product.description.replace(/<[^>]*>/g, ' ').trim();
    parts.push(`Açıklama: ${cleanDesc}`);
  }

  parts.push(`Fiyat: ${product.basePrice} TL`);

  if (attrs) {
    if (attrs.productType) parts.push(`Tip: ${attrs.productType}`);
    if (attrs.fit) parts.push(`Kesim: ${attrs.fit}`);
    if (attrs.material) parts.push(`Malzeme: ${attrs.material}`);
    if (attrs.usage?.length) parts.push(`Kullanım: ${attrs.usage.join(', ')}`);
    if (attrs.season) parts.push(`Sezon: ${attrs.season}`);
    if (attrs.features?.length) parts.push(`Özellikler: ${attrs.features.join(', ')}`);
    if (attrs.targetGender) parts.push(`Cinsiyet: ${attrs.targetGender}`);
    if (attrs.keywords?.length) parts.push(`Anahtar Kelimeler: ${attrs.keywords.join(', ')}`);
  }

  return parts.join('. ');
}

export async function generateAllProductEmbeddings(): Promise<{ success: number; failed: number }> {
  const allProducts = await db.query.products.findMany({
    where: eq(products.isActive, true),
  });

  let success = 0;
  let failed = 0;

  for (const product of allProducts) {
    try {
      await generateProductEmbedding(product.id);
      success++;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Embedding oluşturma hatası (${product.name}):`, error);
      failed++;
    }
  }

  return { success, failed };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function semanticSearch(query: string, limit: number = 5): Promise<string[]> {
  if (!openai) {
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    const allEmbeddings = await db.query.productEmbeddings.findMany({ limit: 100 });

    if (allEmbeddings.length === 0) {
      return [];
    }

    const scores = allEmbeddings.map(pe => ({
      productId: pe.productId,
      score: cosineSimilarity(queryEmbedding, pe.embedding as number[]),
    }));

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, limit).map(s => s.productId);
  } catch (error) {
    console.error('[Chatbot] Semantic search error:', error);
    return [];
  }
}

async function filterByAttributes(
  productType?: string,
  fit?: string,
  season?: string,
  usage?: string,
  priceMax?: number,
  gender?: string
): Promise<string[]> {
  const conditions: any[] = [];

  if (productType) {
    conditions.push(eq(productAttributes.productType, productType));
  }
  if (fit) {
    conditions.push(eq(productAttributes.fit, fit));
  }
  if (season) {
    conditions.push(eq(productAttributes.season, season));
  }
  if (gender) {
    conditions.push(eq(productAttributes.targetGender, gender));
  }

  const query = conditions.length > 0
    ? db.query.productAttributes.findMany({ where: and(...conditions) })
    : db.query.productAttributes.findMany();

  const attrs = await query;
  let productIds = attrs.map(a => a.productId);

  if (usage) {
    const filteredIds = attrs
      .filter(a => a.usage && (a.usage as string[]).includes(usage))
      .map(a => a.productId);
    productIds = filteredIds;
  }

  if (priceMax) {
    const priceFiltered = await db.query.products.findMany({
      where: and(
        sql`${products.id} = ANY(${productIds})`,
        sql`CAST(${products.basePrice} AS DECIMAL) <= ${priceMax}`
      ),
    });
    productIds = priceFiltered.map(p => p.id);
  }

  return productIds;
}

// Direct search by product name or category when attribute filtering fails
async function searchByNameOrCategory(searchTerms: string[]): Promise<string[]> {
  if (searchTerms.length === 0) return [];
  
  const productIds: string[] = [];
  
  for (const term of searchTerms) {
    // Search in product names
    const matchingProducts = await db.query.products.findMany({
      where: and(
        eq(products.isActive, true),
        sql`LOWER(${products.name}) LIKE ${'%' + term.toLowerCase() + '%'}`
      ),
      limit: 10,
    });
    
    for (const p of matchingProducts) {
      if (!productIds.includes(p.id)) {
        productIds.push(p.id);
      }
    }
    
    // Search in category names
    const matchingCategories = await db.query.categories.findMany({
      where: sql`LOWER(${categories.name}) LIKE ${'%' + term.toLowerCase() + '%'}`,
    });
    
    for (const cat of matchingCategories) {
      const catProducts = await db.query.products.findMany({
        where: and(
          eq(products.isActive, true),
          eq(products.categoryId, cat.id)
        ),
        limit: 10,
      });
      
      for (const p of catProducts) {
        if (!productIds.includes(p.id)) {
          productIds.push(p.id);
        }
      }
    }
  }
  
  return productIds;
}

async function getProductDetails(productIds: string[]): Promise<ProductWithDetails[]> {
  if (productIds.length === 0) return [];

  const result: ProductWithDetails[] = [];

  for (const productId of productIds) {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isActive, true)),
      with: {
        category: true,
      },
    });

    if (!product) continue;

    const attrs = await db.query.productAttributes.findFirst({
      where: eq(productAttributes.productId, productId),
    });

    const variants = await db.query.productVariants.findMany({
      where: eq(productVariants.productId, productId),
    });

    result.push({
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      images: product.images || [],
      slug: product.slug,
      categoryName: product.category?.name || null,
      attributes: attrs ? {
        productType: attrs.productType,
        fit: attrs.fit,
        material: attrs.material,
        usage: attrs.usage as string[] || [],
        season: attrs.season,
        features: attrs.features as string[] || [],
        targetGender: attrs.targetGender,
        priceRange: attrs.priceRange,
      } : null,
      variants: variants.map(v => ({
        id: v.id,
        size: v.size || '',
        color: v.color || '',
        colorHex: v.colorHex,
        stock: v.stock,
        price: v.price,
      })),
    });
  }

  return result;
}

function extractIntent(message: string): {
  intent: 'search' | 'size_check' | 'recommendation' | 'general' | 'more' | 'outfit';
  productType?: string;
  productTypes?: string[];
  clothingCategory?: string;
  fit?: string;
  season?: string;
  usage?: string;
  size?: string;
  color?: string;
  priceMax?: number;
  isOutfitRequest?: boolean;
} {
  const lowerMsg = message.toLowerCase();

  const productTypes: Record<string, string> = {
    'tişört': 'tshirt',
    'tshirt': 'tshirt',
    't-shirt': 'tshirt',
    'eşofman': 'esofman',
    'şort': 'sort',
    'atlet': 'atlet',
    'şalvar': 'salvar',
    'sweatshirt': 'sweatshirt',
    'hoodie': 'sweatshirt',
    'kapşonlu': 'sweatshirt',
    'pantolon': 'pantolon',
    'tayt': 'tayt',
    'ceket': 'ceket',
    'mont': 'mont',
  };

  // Clothing category concepts
  const clothingCategories: Record<string, string[]> = {
    'üst giyim': ['tshirt', 'atlet', 'sweatshirt', 'ceket', 'mont'],
    'üst': ['tshirt', 'atlet', 'sweatshirt', 'ceket', 'mont'],
    'alt giyim': ['esofman', 'sort', 'salvar', 'pantolon', 'tayt'],
    'alt': ['esofman', 'sort', 'salvar', 'pantolon', 'tayt'],
    'kombin': ['tshirt', 'atlet', 'sweatshirt', 'esofman', 'sort', 'salvar'],
  };

  const fits: Record<string, string> = {
    'oversize': 'oversize',
    'slim': 'slimfit',
    'slimfit': 'slimfit',
    'slim fit': 'slimfit',
    'dar': 'slimfit',
    'regular': 'regular',
    'normal': 'regular',
  };

  const seasons: Record<string, string> = {
    'yaz': 'yaz',
    'yazlık': 'yaz',
    'kış': 'kis',
    'kışlık': 'kis',
  };

  const usages: Record<string, string> = {
    'spor': 'spor',
    'antrenman': 'antrenman',
    'fitness': 'fitness',
    'günlük': 'gunluk',
    'gündelik': 'gunluk',
  };

  let intent: 'search' | 'size_check' | 'recommendation' | 'general' | 'more' | 'outfit' = 'general';
  let productType: string | undefined;
  let detectedProductTypes: string[] = [];
  let clothingCategory: string | undefined;
  let fit: string | undefined;
  let season: string | undefined;
  let usage: string | undefined;
  let size: string | undefined;
  let color: string | undefined;
  let priceMax: number | undefined;
  let isOutfitRequest = false;

  // Detect outfit/combination requests
  if (lowerMsg.includes('kombin') || lowerMsg.includes('kombinle') || lowerMsg.includes('set') ||
      lowerMsg.includes('takım') || lowerMsg.includes('birlikte') || lowerMsg.includes('eşleştir') ||
      lowerMsg.includes('ne giyeyim') || lowerMsg.includes('ne giysem') || lowerMsg.includes('altına ne') ||
      lowerMsg.includes('üstüne ne') || lowerMsg.includes('yanına ne')) {
    intent = 'outfit';
    isOutfitRequest = true;
  } else if (lowerMsg.includes('beden') || lowerMsg.includes('stok') || lowerMsg.includes('kaldı mı')) {
    intent = 'size_check';
  } else if (lowerMsg.includes('öneri') || lowerMsg.includes('tavsiye') || lowerMsg.includes('ne önerirsin')) {
    intent = 'recommendation';
  } else if (lowerMsg.includes('daha fazla') || lowerMsg.includes('başka') || lowerMsg.includes('devam') || 
             lowerMsg.includes('diğer') || lowerMsg.includes('daha var mı') || lowerMsg.includes('evet')) {
    intent = 'more';
  } else if (lowerMsg.includes('arıyorum') || lowerMsg.includes('istiyorum') || lowerMsg.includes('bakıyorum') || 
             lowerMsg.includes('lazım') || lowerMsg.includes('var mı') || lowerMsg.includes('göster') ||
             lowerMsg.includes('ister') || lowerMsg.includes('almak') || lowerMsg.includes('alacağım') ||
             lowerMsg.includes('ne var') || lowerMsg.includes('neler var')) {
    intent = 'search';
  }

  // Detect clothing categories (alt giyim, üst giyim, etc.)
  for (const [key, types] of Object.entries(clothingCategories)) {
    if (lowerMsg.includes(key)) {
      clothingCategory = key;
      detectedProductTypes = types;
      if (intent === 'general') intent = 'search';
      break;
    }
  }

  // Detect specific product types
  for (const [key, value] of Object.entries(productTypes)) {
    if (lowerMsg.includes(key)) {
      productType = value;
      if (!detectedProductTypes.includes(value)) {
        detectedProductTypes.push(value);
      }
      if (intent === 'general') intent = 'search';
      break;
    }
  }

  for (const [key, value] of Object.entries(fits)) {
    if (lowerMsg.includes(key)) {
      fit = value;
      break;
    }
  }

  for (const [key, value] of Object.entries(seasons)) {
    if (lowerMsg.includes(key)) {
      season = value;
      break;
    }
  }

  for (const [key, value] of Object.entries(usages)) {
    if (lowerMsg.includes(key)) {
      usage = value;
      break;
    }
  }

  // Better size extraction for Turkish - handles "L beden", "XL beden", etc.
  const sizeMatch = lowerMsg.match(/\b(xs|s|m|l|xl|xxl|3xl)\s*beden/i) ||
                    lowerMsg.match(/beden[:\s]*(xs|s|m|l|xl|xxl|3xl)/i) ||
                    lowerMsg.match(/\b(xs|s|m|l|xl|xxl|3xl)\b/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
  }

  const colorKeywords = ['siyah', 'beyaz', 'gri', 'lacivert', 'mavi', 'kırmızı', 'yeşil', 'kahve', 'bej'];
  for (const c of colorKeywords) {
    if (lowerMsg.includes(c)) {
      color = c;
      break;
    }
  }

  const priceMatch = lowerMsg.match(/(\d+)\s*tl/i);
  if (priceMatch) {
    priceMax = parseInt(priceMatch[1]);
  }

  return { 
    intent, 
    productType, 
    productTypes: detectedProductTypes.length > 0 ? detectedProductTypes : undefined,
    clothingCategory,
    fit, 
    season, 
    usage, 
    size, 
    color, 
    priceMax,
    isOutfitRequest 
  };
}

export async function processMessage(
  sessionToken: string,
  userMessage: string,
  userId?: string
): Promise<{ response: string; products: ProductWithDetails[] }> {
  // Content moderation check
  const contentCheck = containsBlockedContent(userMessage);
  if (contentCheck.blocked) {
    if (contentCheck.reason === 'inappropriate') {
      return { 
        response: 'Üzgünüm, bu tür mesajlara yanıt veremiyorum. Lütfen ürünlerimiz hakkında sorularınızı paylaşın.', 
        products: [] 
      };
    }
    if (contentCheck.reason === 'competitor') {
      return { 
        response: 'Ben sadece HANK ürünleri hakkında yardımcı olabiliyorum. Size HANK koleksiyonumuzdan harika alternatifler önerebilirim! Nasıl yardımcı olabilirim?', 
        products: [] 
      };
    }
  }

  let session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.sessionToken, sessionToken),
  });

  if (!session) {
    const [newSession] = await db.insert(chatSessions)
      .values({ sessionToken, userId })
      .returning();
    session = newSession;
  }

  await db.insert(chatMessages).values({
    sessionId: session.id,
    role: 'user',
    content: userMessage,
  });

  const recentMessages = await db.query.chatMessages.findMany({
    where: eq(chatMessages.sessionId, session.id),
    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    limit: 10,
  });

  const conversationHistory = recentMessages.reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const intent = extractIntent(userMessage);
  let relevantProducts: ProductWithDetails[] = [];

  // Turkish keywords for product type search
  const turkishKeywords: Record<string, string[]> = {
    'sort': ['şort', 'sort'],
    'tshirt': ['tişört', 'tshirt', 't-shirt'],
    'esofman': ['eşofman', 'esofman', 'eşofman altı', 'eşofman üstü'],
    'atlet': ['atlet'],
    'salvar': ['şalvar', 'salvar'],
    'sweatshirt': ['sweatshirt', 'hoodie', 'kapşonlu'],
    'pantolon': ['pantolon'],
    'tayt': ['tayt', 'legging'],
    'ceket': ['ceket'],
    'mont': ['mont'],
  };

  // For outfit requests, get products from multiple categories
  if (intent.isOutfitRequest || intent.intent === 'outfit') {
    // Get both tops and bottoms for outfit suggestions
    const topTerms = ['tişört', 'atlet', 'sweatshirt'];
    const bottomTerms = ['şort', 'eşofman', 'şalvar', 'pantolon'];
    
    const topIds = await searchByNameOrCategory(topTerms);
    const bottomIds = await searchByNameOrCategory(bottomTerms);
    
    // Get some from each category
    const combinedOutfitIds = [...topIds.slice(0, 5), ...bottomIds.slice(0, 5)];
    relevantProducts = await getProductDetails(combinedOutfitIds);
  } else {
    // Regular search
    const attributeFilteredIds = await filterByAttributes(
      intent.productType,
      intent.fit,
      intent.season,
      intent.usage,
      intent.priceMax
    );

    const semanticIds = await semanticSearch(userMessage, 10);

    // Direct name/category search
    const searchTerms: string[] = [];
    
    // If specific product types detected
    if (intent.productTypes && intent.productTypes.length > 0) {
      for (const pt of intent.productTypes) {
        if (turkishKeywords[pt]) {
          searchTerms.push(...turkishKeywords[pt]);
        }
      }
    } else if (intent.productType && turkishKeywords[intent.productType]) {
      searchTerms.push(...turkishKeywords[intent.productType]);
    }
    
    // Add color to search terms if specified
    if (intent.color) {
      searchTerms.push(intent.color);
    }
    
    const nameSearchIds = await searchByNameOrCategory(searchTerms);

    let combinedIds = Array.from(new Set([...attributeFilteredIds, ...nameSearchIds, ...semanticIds])).slice(0, 15);
    
    // Fallback: If no products found, get some active products
    if (combinedIds.length === 0) {
      const fallbackProducts = await db.query.products.findMany({
        where: eq(products.isActive, true),
        limit: 15,
      });
      combinedIds = fallbackProducts.map(p => p.id);
    }
    
    relevantProducts = await getProductDetails(combinedIds);
  }

  // Filter by color if specified
  if (intent.color) {
    const colorFiltered = relevantProducts.filter(p => 
      p.name.toLowerCase().includes(intent.color!) ||
      p.variants.some(v => v.color.toLowerCase().includes(intent.color!))
    );
    if (colorFiltered.length > 0) {
      relevantProducts = colorFiltered;
    }
  }

  // Filter by size if specified
  if (intent.size) {
    const sizeFiltered = relevantProducts.filter(p => 
      p.variants.some(v => v.size.toUpperCase() === intent.size?.toUpperCase() && v.stock > 0)
    );
    if (sizeFiltered.length > 0) {
      relevantProducts = sizeFiltered;
    }
  }

  // Determine if this is an outfit request for special handling
  const isOutfit = intent.isOutfitRequest || intent.intent === 'outfit';
  
  const systemPrompt = `Sen HANK fitness giyim markasının profesyonel stil danışmanı ve satış asistanısın. Türkçe konuşuyorsun.

SEN KİMSİN:
- HANK markasının uzman stil danışmanısın
- Fitness giyim konusunda uzmansın
- Müşterilere kombin önerileri yapabilirsin
- Samimi ama profesyonel bir dil kullan

TEMEL KURALLAR:
1. SADECE aşağıdaki "Mevcut Ürünler" listesindeki ürünleri öner
2. Listede olmayan ürün UYDURMA
3. Her ürünü TAM İSMİYLE yaz (kısaltma yapma)
4. Gerçek fiyatları kullan
5. Özür dileme, "yanlış bilgi verdim" gibi ifadeler YASAK
6. Kısa ve net ol

KOMBİN ÖNERİSİ YAPARKEN:
- Üst ve alt giyimi birlikte öner
- Renk uyumunu düşün (örn: siyah üst + gri alt, beyaz üst + siyah alt)
- "Bu üstün altına şunu önerebilirim" gibi doğal cümleler kur
- Hem spor hem günlük kullanım için uygun seçenekler sun

RENK KAVRAMLARI:
- "Beyaz tonlar" = beyaz, krem, ekru içeren ürünler
- "Koyu tonlar" = siyah, lacivert, koyu gri içeren ürünler
- "Açık tonlar" = beyaz, açık gri, bej içeren ürünler

GİYİM KATEGORİLERİ:
- "Üst giyim" = tişört, atlet, sweatshirt, hoodie
- "Alt giyim" = şort, eşofman, şalvar, pantolon
- Müşteri "alt giyim" derse şort, eşofman, şalvar öner
- Müşteri "üst giyim" derse tişört, atlet, sweatshirt öner

DEVAM İSTEKLERİ:
- "Evet", "daha fazla", "başka" = sohbet geçmişinde ÖNERMEDİĞİN ürünleri göster
- Aynı ürünü tekrar önerme

${relevantProducts.length > 0 ? `
MEVCUT ÜRÜNLER (SADECE BUNLARI ÖNEREBİLİRSİN):
${relevantProducts.map((p, index) => `
${index + 1}. ${p.name}
   Fiyat: ${p.basePrice} TL
   ${p.categoryName ? `Kategori: ${p.categoryName}` : ''}
   Renkler: ${Array.from(new Set(p.variants.filter(v => v.stock > 0).map(v => v.color))).join(', ') || 'Belirtilmemiş'}
   ${p.attributes?.fit ? `Kesim: ${p.attributes.fit}` : ''}
   Stokta bedenler: ${p.variants.filter(v => v.stock > 0).map(v => v.size).join(', ') || 'Stokta yok'}
`).join('\n')}

${isOutfit ? `
Müşteri kombin istiyor. Yukarıdaki listeden uyumlu üst ve alt giyim kombinasyonları öner. Renk uyumuna dikkat et.
` : `
Bu listeden müşterinin ihtiyacına en uygun ürünleri öner. Ürün numaralarını kullanabilirsin.
`}
` : `
UYARI: Müşterinin kriterlerine uygun ürün bulunamadı. Ürün adı veya fiyat UYDURMA. "Şu an bu kriterlere uygun ürünümüz bulunmuyor, ancak tüm ürünlerimizi sitemizde inceleyebilirsiniz" de.
`}`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
  ];

  if (!openai) {
    return { response: 'Chatbot servisi şu anda kullanılamıyor.', products: [] };
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const assistantResponse = completion.choices[0]?.message?.content || 'Üzgünüm, şu an yanıt veremiyorum.';

  await db.insert(chatMessages).values({
    sessionId: session.id,
    role: 'assistant',
    content: assistantResponse,
    productRecommendations: relevantProducts.map(p => p.id),
  });

  await db.update(chatSessions)
    .set({ lastMessageAt: new Date() })
    .where(eq(chatSessions.id, session.id));

  return { response: assistantResponse, products: relevantProducts };
}

export async function getChatHistory(sessionToken: string): Promise<Array<{ role: string; content: string; createdAt: Date }>> {
  const session = await db.query.chatSessions.findFirst({
    where: eq(chatSessions.sessionToken, sessionToken),
  });

  if (!session) return [];

  const messages = await db.query.chatMessages.findMany({
    where: eq(chatMessages.sessionId, session.id),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });

  return messages.map(m => ({
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export async function checkSizeAvailability(
  productId: string,
  size: string
): Promise<{ available: boolean; stock: number; color?: string }[]> {
  const variants = await db.query.productVariants.findMany({
    where: and(
      eq(productVariants.productId, productId),
      eq(productVariants.size, size)
    ),
  });

  return variants.map(v => ({
    available: v.stock > 0,
    stock: v.stock,
    color: v.color || undefined,
  }));
}
