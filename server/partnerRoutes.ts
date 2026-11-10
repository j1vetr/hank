import type { Express, RequestHandler, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "./db";
import { codeSchema, moneySchema, PartnerError, passwordSchema, usernameSchema } from "./partnerDomain";
import {
  clearPartnerCookie, createPartnerSession, getPartner, hashToken, loginPartner,
  PARTNER_COOKIE, partnerAuthLimit, partnerSameOrigin, registerPartner, setPartnerCookie,
} from "./partnerAuth";
import { getPartnerDashboard, withdrawalView } from "./partnerDashboard";
import { processWithdrawal, reserveWithdrawal } from "./partnerFinance";
import type { PartnerProfile } from "@shared/partner";

type AuthedRequest = Request & { partner?: PartnerProfile };
const handle = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>): RequestHandler => async (req, res) => {
  try { await fn(req, res); }
  catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Bilgileri kontrol edin. Kullanıcı adı en az 3 karakter, şifre en az 8 karakter olmalı" });
    if (error instanceof PartnerError) return res.status(error.status).json({ error: error.message });
    if ((error as any)?.code === "23505") return res.status(409).json({ error: "Bu hesap veya kullanıcı adı zaten kullanılıyor" });
    console.error("[Partner] İşlem tamamlanamadı", (error as any)?.code || "internal");
    res.status(500).json({ error: "İşlem tamamlanamadı. Lütfen tekrar deneyin" });
  }
};
const requirePartner = handle(async (req, res) => {
  const partner = await getPartner(req);
  if (!partner) return res.status(401).json({ error: "Partner girişi gerekli" });
  req.partner = partner;
});
// Explicit middleware wrapper since the error-safe handler above doesn't call next.
const authenticate: RequestHandler = async (req: AuthedRequest, res, next) => {
  await requirePartner(req, res, next);
  if (req.partner && !res.headersSent) next();
};

export function registerPartnerRoutes(app: Express, requireAdmin: RequestHandler) {
  app.use("/api/partner", partnerSameOrigin);
  app.use("/api/admin/partners", partnerSameOrigin);
  app.use("/api/admin/partner-withdrawals", partnerSameOrigin);

  app.post("/api/partner/lookup", partnerAuthLimit, handle(async (req, res) => {
    const { code } = z.object({ code: codeSchema }).strict().parse(req.body);
    const row = (await db.execute(sql`
      SELECT c.code,a.password_hash IS NOT NULL AS configured
      FROM coupons c LEFT JOIN partner_accounts a ON a.coupon_id=c.id
      WHERE upper(c.code)=upper(${code}) AND c.is_influencer_code=true LIMIT 1
    `)).rows[0] as any;
    if (!row) throw new PartnerError("Influencer kodu bulunamadı", 404);
    res.json({ next: row.configured ? "login" : "register", code: row.code });
  }));
  app.post("/api/partner/register", partnerAuthLimit, handle(async (req, res) => {
    const data = z.object({
      code: codeSchema, referenceCode: z.string().max(100),
      username: usernameSchema, password: passwordSchema,
    }).strict().parse(req.body);
    const result = await registerPartner(data.code, data.referenceCode, data.username, data.password);
    setPartnerCookie(res, result.token);
    res.status(201).json(result.profile);
  }));
  app.post("/api/partner/reference", partnerAuthLimit, handle(async (req, res) => {
    const data = z.object({ code: codeSchema, referenceCode: z.string().max(100) }).strict().parse(req.body);
    if (data.referenceCode !== "HANKS") throw new PartnerError("Referans kodu geçersiz");
    const row = (await db.execute(sql`
      SELECT c.id,a.enabled,a.password_hash IS NOT NULL AS configured
      FROM coupons c LEFT JOIN partner_accounts a ON a.coupon_id=c.id
      WHERE upper(c.code)=upper(${data.code}) AND c.is_influencer_code=true LIMIT 1
    `)).rows[0] as any;
    if (!row) throw new PartnerError("Influencer kodu bulunamadı", 404);
    if (row.configured || row.enabled === false) throw new PartnerError("Hesap kuruluma açık değil. Şifrenizle giriş yapın veya yöneticiyle iletişime geçin", 409);
    res.json({ success: true });
  }));
  app.post("/api/partner/login", partnerAuthLimit, handle(async (req, res) => {
    const data = z.object({ identifier: codeSchema, password: z.string().min(1).max(200) }).strict().parse(req.body);
    const result = await loginPartner(data.identifier, data.password);
    setPartnerCookie(res, result.token);
    res.json(result.profile);
  }));
  app.post("/api/partner/logout", handle(async (req, res) => {
    const token = req.cookies?.[PARTNER_COOKIE];
    if (typeof token === "string") await db.execute(sql`DELETE FROM partner_sessions WHERE token_hash=${hashToken(token)}`);
    clearPartnerCookie(res);
    res.json({ success: true });
  }));
  app.get("/api/partner/me", authenticate, handle(async (req, res) => { res.json(req.partner); }));
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  });
  app.get("/api/partner/dashboard", authenticate, handle(async (req, res) => {
    const q = z.object({
      startDate: date.optional(), endDate: date.optional(),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    }).strict().parse(req.query);
    if (q.startDate && q.endDate && q.startDate > q.endDate) throw new PartnerError("Başlangıç tarihi bitiş tarihinden sonra olamaz");
    res.json(await getPartnerDashboard(req.partner!, q.startDate, q.endDate, q.page));
  }));
  app.post("/api/partner/withdrawals", authenticate, handle(async (req, res) => {
    const data = z.object({ amount: moneySchema, note: z.string().trim().max(500).optional() }).strict().parse(req.body);
    res.status(201).json(await reserveWithdrawal(req.partner!.couponId, data.amount, data.note));
  }));
  app.post("/api/partner/password", authenticate, partnerAuthLimit, handle(async (req, res) => {
    const data = z.object({ currentPassword: z.string().max(200), password: passwordSchema }).strict().parse(req.body);
    const current = (await db.execute(sql`SELECT password_hash FROM partner_accounts WHERE id=${req.partner!.id}`)).rows[0] as any;
    if (!current?.password_hash || !await bcrypt.compare(data.currentPassword, current.password_hash)) throw new PartnerError("Mevcut şifreniz hatalı");
    const passwordHash = await bcrypt.hash(data.password, 12);
    const token = await db.transaction(async tx => {
      const latest = (await tx.execute(sql`SELECT * FROM partner_accounts WHERE id=${req.partner!.id} FOR UPDATE`)).rows[0] as any;
      if (!latest?.enabled || latest.password_hash !== current.password_hash) throw new PartnerError("Hesap bilgileri değişti. Tekrar giriş yapın", 401);
      await tx.execute(sql`UPDATE partner_accounts SET password_hash=${passwordHash} WHERE id=${req.partner!.id}`);
      await tx.execute(sql`DELETE FROM partner_sessions WHERE account_id=${req.partner!.id}`);
      return createPartnerSession(tx, req.partner!.id);
    });
    setPartnerCookie(res, token);
    res.json({ success: true });
  }));

  app.get("/api/admin/partners", requireAdmin, handle(async (_req, res) => {
    const [a, w] = await Promise.all([
      db.execute(sql`SELECT id,coupon_id,username,enabled,password_hash IS NULL AS reset_required,created_at FROM partner_accounts ORDER BY created_at DESC`),
      db.execute(sql`
        SELECT w.*,c.code,COALESCE(c.influencer_name,c.code) AS name FROM partner_withdrawals w
        JOIN coupons c ON c.id=w.coupon_id ORDER BY w.created_at DESC
      `),
    ]);
    res.json({
      accounts: (a.rows as any[]).map(r => ({ id: r.id, couponId: r.coupon_id, username: r.username, enabled: r.enabled, resetRequired: r.reset_required, createdAt: new Date(r.created_at).toISOString() })),
      withdrawals: w.rows.map((r: any) => ({ ...withdrawalView(r), code: r.code, name: r.name })),
    });
  }));
  app.post("/api/admin/partners/:couponId/reset-password", requireAdmin, handle(async (req, res) => {
    await db.transaction(async tx => {
      const a = (await tx.execute(sql`SELECT id FROM partner_accounts WHERE coupon_id=${req.params.couponId} FOR UPDATE`)).rows[0] as any;
      if (!a) throw new PartnerError("Henüz partner hesabı oluşturulmamış", 404);
      await tx.execute(sql`UPDATE partner_accounts SET password_hash=NULL WHERE id=${a.id}`);
      await tx.execute(sql`DELETE FROM partner_sessions WHERE account_id=${a.id}`);
    });
    res.json({ success: true });
  }));
  app.patch("/api/admin/partners/:couponId/access", requireAdmin, handle(async (req, res) => {
    const { enabled } = z.object({ enabled: z.boolean() }).strict().parse(req.body);
    await db.transaction(async tx => {
      const a = (await tx.execute(sql`SELECT id FROM partner_accounts WHERE coupon_id=${req.params.couponId} FOR UPDATE`)).rows[0] as any;
      if (!a) throw new PartnerError("Partner hesabı bulunamadı", 404);
      await tx.execute(sql`UPDATE partner_accounts SET enabled=${enabled} WHERE id=${a.id}`);
      await tx.execute(sql`DELETE FROM partner_sessions WHERE account_id=${a.id}`);
    });
    res.json({ success: true });
  }));
  app.patch("/api/admin/partner-withdrawals/:id", requireAdmin, handle(async (req, res) => {
    const data = z.object({ status: z.enum(["paid", "rejected"]), note: z.string().trim().max(500).optional() }).strict().parse(req.body);
    res.json(await processWithdrawal(req.params.id, data.status, data.note));
  }));
}
