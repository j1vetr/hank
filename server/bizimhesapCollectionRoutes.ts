import type { Express, RequestHandler } from "express";
import type { BizimHesapCollectionSettings } from "@shared/schema";
import {
  collectionSettingsRequestSchema, collectionSettingsView, listBizimHesapCashiers,
  type BizimHesapCashier, type CollectionSettingsInput,
} from "./bizimhesapCollection";

type Repository = {
  getBizimHesapCollectionSettings(): Promise<BizimHesapCollectionSettings | undefined>;
  saveBizimHesapCollectionSettings(settings: CollectionSettingsInput): Promise<BizimHesapCollectionSettings>;
};

export function registerBizimHesapCollectionRoutes(
  app: Express,
  requireAdmin: RequestHandler,
  repository: Repository,
  listCashiers: () => Promise<BizimHesapCashier[]> = listBizimHesapCashiers,
) {
  app.get("/api/admin/bizimhesap/collection-settings", requireAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      res.json(collectionSettingsView(await repository.getBizimHesapCollectionSettings()));
    } catch {
      res.status(500).json({ error: "BizimHesap tahsilat ayarları alınamadı." });
    }
  });

  app.get("/api/admin/bizimhesap/cashiers", requireAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      res.json({ cashiers: await listCashiers() });
    } catch {
      res.status(502).json({ error: "BizimHesap kasaları alınamadı. Bağlantıyı kontrol edip tekrar deneyin." });
    }
  });

  app.post("/api/admin/bizimhesap/collection-settings", requireAdmin, async (req, res) => {
    res.set("Cache-Control", "no-store");
    const parsed = collectionSettingsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Tahsilat ayarlarını ve kasa seçimini kontrol edin." });
    }
    try {
      let settings: CollectionSettingsInput;
      if (parsed.data.enabled) {
        let cashiers: BizimHesapCashier[];
        try {
          cashiers = await listCashiers();
        } catch {
          return res.status(502).json({ error: "Kasa seçimi BizimHesap üzerinden doğrulanamadı. Ayar değiştirilmedi." });
        }
        const cashId = parsed.data.cashId;
        const cashier = cashiers.find(cashier => cashier.id === cashId);
        if (!cashier) return res.status(400).json({ error: "Seçilen kasa bulunamadı. Kasa listesini yenileyin." });
        settings = { enabled: true, cashId: cashier.id, cashTitle: cashier.title };
      } else {
        const current = await repository.getBizimHesapCollectionSettings();
        settings = { enabled: false, cashId: current?.cashId ?? null, cashTitle: current?.cashTitle ?? null };
      }
      const saved = await repository.saveBizimHesapCollectionSettings(settings);
      res.json(collectionSettingsView(saved));
    } catch {
      res.status(500).json({ error: "BizimHesap tahsilat ayarları kaydedilemedi." });
    }
  });
}
