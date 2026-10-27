export const AUTO_CART_CAMPAIGN_NAME = "2 Ürün Al, 3. Üründe %50 İndirim Fırsatı";
export const AUTO_CART_CAMPAIGN_DESCRIPTION =
  "Sepetine herhangi 2 ürün ekle, indirim kapsamındaki ürünlerden 1 ürün daha al. Seçtiğin üçüncü üründe %50 indirim fırsatını yakala.";

type CampaignDisplayInput = {
  campaignType?: string;
  discountType?: string;
  discountPercentage?: string | number | null;
  discountAmount?: string | number | null;
};

export function getCampaignPresentation(campaign: CampaignDisplayInput) {
  if (campaign.campaignType !== "direct") {
    return {
      name: AUTO_CART_CAMPAIGN_NAME,
      description: AUTO_CART_CAMPAIGN_DESCRIPTION,
      customerMessage: null,
    };
  }
  const discount = campaign.discountType === "fixed"
    ? `${Number(campaign.discountAmount || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL`
    : `%${Number(campaign.discountPercentage || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  return {
    name: `Sepette ${discount} İndirim Fırsatı`,
    description: campaign.discountType === "fixed"
      ? `Sepetindeki kampanyaya dahil ürünlerde toplam ${discount} indirim seni bekliyor. İndirim sepet başına bir kez uygulanır ve uygun ürünlerin toplamını aşmaz. Kupon kodunla avantajını artır.`
      : `Kampanyaya dahil ürünlerde ${discount} indirim sepette seni bekliyor. Adet şartı olmadan avantajı yakala, kupon kodunla kazancını artır.`,
    customerMessage: null,
  };
}
