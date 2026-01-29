import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type DescriptionStyle = 'professional' | 'energetic' | 'minimal' | 'luxury' | 'sporty';

const stylePrompts: Record<DescriptionStyle, string> = {
  professional: `Profesyonel ve kurumsal bir ton kullan. Ürünün teknik özelliklerini ve kalitesini vurgula. Güvenilirlik ve uzmanlık hissi ver.`,
  energetic: `Enerjik ve motive edici bir ton kullan. Spor ve fitness tutkusunu yansıt. Dinamik ve heyecan verici bir dil kullan.`,
  minimal: `Minimal ve özlü bir ton kullan. Kısa, net ve etkili cümleler kur. Gereksiz detaylardan kaçın, öze odaklan.`,
  luxury: `Lüks ve premium bir ton kullan. Üst düzey kalite ve ayrıcalık hissi ver. Sofistike ve zarif bir dil kullan.`,
  sporty: `Sportif ve atletik bir ton kullan. Performans ve dayanıklılık vurgula. Aktif yaşam tarzını öne çıkar.`,
};

const styleNames: Record<DescriptionStyle, string> = {
  professional: 'Profesyonel',
  energetic: 'Enerjik',
  minimal: 'Minimal',
  luxury: 'Lüks',
  sporty: 'Sportif',
};

export { styleNames };

export async function generateProductDescription(
  productName: string,
  imageUrl: string | null,
  style: DescriptionStyle
): Promise<string> {
  const stylePrompt = stylePrompts[style];
  
  const systemPrompt = `Sen HANK markası için çalışan profesyonel bir ürün açıklaması yazarısın. HANK, Türkiye'nin premium fitness ve spor giyim markasıdır.

Görevin:
1. Verilen ürün adını ve fotoğrafını analiz et
2. Belirtilen stilde etkileyici bir ürün açıklaması yaz
3. Açıklama HTML formatında olmalı (paragraflar için <p>, listeler için <ul><li>, vurgular için <strong> kullan)
4. Türkçe yaz
5. 150-250 kelime arası olsun
6. SEO dostu olsun

Stil: ${stylePrompt}

Önemli:
- Sadece HTML içeriği döndür, başka açıklama ekleme
- <html>, <body>, <head> gibi etiketler KULLANMA
- Sadece içerik etiketleri kullan: <p>, <ul>, <li>, <strong>, <em>
- Ürünün özelliklerini, kullanım alanlarını ve avantajlarını vurgula`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (imageUrl) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Ürün Adı: ${productName}\n\nBu ürün için "${styleNames[style]}" tarzında bir açıklama yaz.`,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'low',
          },
        },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: `Ürün Adı: ${productName}\n\nBu ürün için "${styleNames[style]}" tarzında bir açıklama yaz.`,
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('AI yanıt üretemedi');
  }

  return content.trim();
}
