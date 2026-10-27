import { insertAutoCartCampaignSchema } from "@shared/schema";
import { getCampaignPresentation } from "@shared/campaignDisplay";

export function parseAutoCartCampaignPayload(payload: any) {
  const arrayValue = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
  const dateValue = (value: unknown) => {
    if (!value) return null;
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) throw new Error("Geçersiz kampanya tarihi");
    return parsed;
  };
  const scopeType = payload?.scopeType || "all";
  if (!["all", "categories", "products"].includes(scopeType)) {
    throw new Error("Geçersiz kampanya kapsamı");
  }
  return insertAutoCartCampaignSchema.parse({
    ...payload,
    ...getCampaignPresentation(payload || {}),
    ...(payload?.campaignType === "direct"
      ? { buyQuantity: 1, rewardQuantity: 1 }
      : {}),
    startsAt: dateValue(payload?.startsAt),
    endsAt: dateValue(payload?.endsAt),
    maxApplications: payload?.campaignType === "direct" || payload?.maxApplications === "" || payload?.maxApplications === undefined
      ? null
      : payload.maxApplications,
    scopeType,
    includedCategoryIds: arrayValue(payload?.includedCategoryIds),
    includedProductIds: arrayValue(payload?.includedProductIds),
    excludedCategoryIds: arrayValue(payload?.excludedCategoryIds),
    excludedProductIds: arrayValue(payload?.excludedProductIds),
  });
}
