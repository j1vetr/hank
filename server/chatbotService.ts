import OpenAI from "openai";
import { db } from "./db";
import { products, productVariants, productAttributes, productEmbeddings, categories, chatSessions, chatMessages } from "@shared/schema";
import { eq, and, sql, ilike, or, inArray } from "drizzle-orm";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

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
  intent: 'search' | 'size_check' | 'recommendation' | 'general';
  productType?: string;
  fit?: string;
  season?: string;
  usage?: string;
  size?: string;
  color?: string;
  priceMax?: number;
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

  let intent: 'search' | 'size_check' | 'recommendation' | 'general' = 'general';
  let productType: string | undefined;
  let fit: string | undefined;
  let season: string | undefined;
  let usage: string | undefined;
  let size: string | undefined;
  let color: string | undefined;
  let priceMax: number | undefined;

  if (lowerMsg.includes('beden') || lowerMsg.includes('stok') || lowerMsg.includes('kaldı mı')) {
    intent = 'size_check';
  } else if (lowerMsg.includes('öneri') || lowerMsg.includes('tavsiye') || lowerMsg.includes('ne önerirsin')) {
    intent = 'recommendation';
  } else if (lowerMsg.includes('arıyorum') || lowerMsg.includes('istiyorum') || lowerMsg.includes('bakıyorum') || 
             lowerMsg.includes('lazım') || lowerMsg.includes('var mı') || lowerMsg.includes('göster') ||
             lowerMsg.includes('ister') || lowerMsg.includes('almak') || lowerMsg.includes('alacağım')) {
    intent = 'search';
  }

  for (const [key, value] of Object.entries(productTypes)) {
    if (lowerMsg.includes(key)) {
      productType = value;
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

  const sizeMatch = lowerMsg.match(/\b(xs|s|m|l|xl|xxl|3xl)\b/i);
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

  return { intent, productType, fit, season, usage, size, color, priceMax };
}

export async function processMessage(
  sessionToken: string,
  userMessage: string,
  userId?: string
): Promise<{ response: string; products: ProductWithDetails[] }> {
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

  // Always try to find relevant products for any message
  const attributeFilteredIds = await filterByAttributes(
    intent.productType,
    intent.fit,
    intent.season,
    intent.usage,
    intent.priceMax
  );

  const semanticIds = await semanticSearch(userMessage, 10);

  let combinedIds = Array.from(new Set([...attributeFilteredIds, ...semanticIds])).slice(0, 5);
  
  // Fallback: If no products found, get some active products to prevent hallucination
  if (combinedIds.length === 0) {
    const fallbackProducts = await db.query.products.findMany({
      where: eq(products.isActive, true),
      limit: 5,
    });
    combinedIds = fallbackProducts.map(p => p.id);
  }
  
  relevantProducts = await getProductDetails(combinedIds);

  if (intent.size && intent.intent === 'size_check') {
    relevantProducts = relevantProducts.filter(p => 
      p.variants.some(v => v.size === intent.size && v.stock > 0)
    );
  }

  const systemPrompt = `Sen HANK fitness giyim markasının satış asistanısın. Türkçe konuşuyorsun.

ÖNEMLİ KURALLAR - KESİNLİKLE UYULMALI:
1. SADECE aşağıdaki "Mevcut Ürünler" listesindeki ürünleri önerebilirsin
2. LİSTEDE OLMAYAN HİÇBİR ÜRÜN ADI, FİYAT VEYA ÖZELLİK UYDURMA - bu kesinlikle yasak
3. Eğer aşağıda ürün listesi boşsa veya müşterinin istediğine uygun ürün yoksa, açıkça "Şu an bu kriterlere uygun ürünümüz bulunmuyor, ancak sitemizi ziyaret edebilirsiniz" de
4. Her zaman gerçek fiyatları kullan - listede yazan fiyatlar
5. Beden ve stok bilgisi sadece listede yazıyorsa ver
6. Yanıtlarını kısa tut

${relevantProducts.length > 0 ? `
MEVCUT ÜRÜNLER (SADECE BUNLARı ÖNEREBİLİRSİN):
${relevantProducts.map(p => `
• ${p.name}
  Fiyat: ${p.basePrice} TL
  ${p.categoryName ? `Kategori: ${p.categoryName}` : ''}
  ${p.attributes?.fit ? `Kesim: ${p.attributes.fit}` : ''}
  ${p.attributes?.material ? `Malzeme: ${p.attributes.material}` : ''}
  ${p.attributes?.season ? `Sezon: ${p.attributes.season}` : ''}
  Stokta olan bedenler: ${p.variants.filter(v => v.stock > 0).map(v => `${v.size}`).join(', ') || 'Stokta yok'}
`).join('\n')}

Bu listedeki ürünlerden müşterinin ihtiyacına en uygun olanları öner.
` : `
UYARI: Şu an müşterinin kriterlerine uygun ürün bulunamadı. Ürün adı veya fiyat UYDURMA. Müşteriyi siteyi ziyaret etmeye yönlendir.
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
