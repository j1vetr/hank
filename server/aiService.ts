import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. AI description generation will not work.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API anahtarı ayarlanmamış. Lütfen OPENAI_API_KEY secret ekleyin.');
  }
  const stylePrompt = stylePrompts[style];
  
  const systemPrompt = `Sen HANK markası için çalışan profesyonel bir ürün açıklaması yazarısın. HANK, Türkiye'nin premium fitness ve spor giyim markasıdır.

Görevin:
1. Verilen ürün adını ve fotoğrafını analiz et
2. Fotoğraftan ürünün rengini tespit et ve açıklamada mutlaka belirt (örn: "siyah rengi ile şık", "beyaz tonuyla ferah")
3. Belirtilen stilde etkileyici bir ürün açıklaması yaz
4. Açıklama HTML formatında olmalı
5. Türkçe yaz
6. 150-250 kelime arası olsun
7. SEO dostu olsun

Stil: ${stylePrompt}

FORMAT KURALLARI (ÇOK ÖNEMLİ):
- Paragraflar arasında boş satır bırak (her <p> etiketi ayrı satırda olsun)
- Uygun yerlerde emoji kullan (💪 🔥 ⚡ 🏆 ✨ 🎯 💯 🖤 ⭐ gibi fitness/spor temalı)
- Liste öğelerinde de emoji kullanabilirsin
- Her paragraf yeni satırda başlasın
- Görsel olarak çekici ve okunabilir olsun

HTML KURALLARI:
- Sadece HTML içeriği döndür, başka açıklama ekleme
- <html>, <body>, <head> gibi etiketler KULLANMA
- Sadece içerik etiketleri kullan: <p>, <ul>, <li>, <strong>, <em>, <br>
- Ürünün özelliklerini, kullanım alanlarını ve avantajlarını vurgula

ÖRNEK FORMAT:
<p>🔥 <strong>Ürün Başlığı</strong> - Açıklama metni...</p>

<p>💪 İkinci paragraf metni...</p>

<ul>
<li>⚡ Özellik 1</li>
<li>🏆 Özellik 2</li>
</ul>

<p>✨ Son paragraf...</p>`;

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
