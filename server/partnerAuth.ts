import type { Request, Response, RequestHandler } from "express";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { PartnerError } from "./partnerDomain";
import type { PartnerProfile } from "@shared/partner";
import type { PartnerTx } from "./partnerFinance";

export const PARTNER_COOKIE = "hank_partner_session";
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
const expires = 7 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, path: "/api/partner",
};

export function profile(row: any): PartnerProfile {
  return {
    id: row.id, couponId: row.coupon_id, username: row.username,
    code: row.code, name: row.influencer_name || row.code,
    commissionType: row.commission_type, commissionValue: row.commission_value,
  };
}

export async function getPartner(req: Request): Promise<PartnerProfile | null> {
  const token = req.cookies?.[PARTNER_COOKIE];
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = (await db.execute(sql`
    SELECT a.*,c.code,c.influencer_name,c.commission_type,c.commission_value
    FROM partner_sessions s JOIN partner_accounts a ON a.id=s.account_id
    JOIN coupons c ON c.id=a.coupon_id
    WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now()
      AND a.enabled=true AND a.password_hash IS NOT NULL AND c.is_influencer_code=true
  `)).rows[0];
  return row ? profile(row) : null;
}

export async function createPartnerSession(tx: PartnerTx, accountId: string) {
  const token = randomBytes(32).toString("hex");
  await tx.execute(sql`DELETE FROM partner_sessions WHERE expires_at<now()`);
  await tx.execute(sql`
    INSERT INTO partner_sessions(token_hash,account_id,expires_at)
    VALUES(${hashToken(token)},${accountId},${new Date(Date.now() + expires)})
  `);
  return token;
}

export function setPartnerCookie(res: Response, token: string) {
  res.cookie(PARTNER_COOKIE, token, { ...cookieOptions, maxAge: expires });
}
export function clearPartnerCookie(res: Response) {
  res.clearCookie(PARTNER_COOKIE, cookieOptions);
}

export async function registerPartner(code: string, referenceCode: string, username: string, password: string) {
  if (referenceCode !== "HANKS") throw new PartnerError("Referans kodu geçersiz");
  const passwordHash = await bcrypt.hash(password, 12);
  return db.transaction(async tx => {
    // Serializes username/code namespace checks and first ownership claims.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(73401921)`);
    const c = (await tx.execute(sql`SELECT * FROM coupons WHERE upper(code)=upper(${code}) AND is_influencer_code=true FOR UPDATE`)).rows[0] as any;
    if (!c) throw new PartnerError("Influencer kodu bulunamadı", 404);
    const current = (await tx.execute(sql`SELECT * FROM partner_accounts WHERE coupon_id=${c.id} FOR UPDATE`)).rows[0] as any;
    if (current && (!current.enabled || current.password_hash)) {
      throw new PartnerError(current.enabled ? "Bu kodun hesabı zaten oluşturulmuş. Şifrenizle giriş yapın" : "Partner erişimi kapalı. Yöneticiyle iletişime geçin", 409);
    }
    const conflict = (await tx.execute(sql`
      SELECT id FROM partner_accounts WHERE username=${username} AND coupon_id<>${c.id}
      UNION ALL SELECT id FROM coupons WHERE lower(code)=${username} AND id<>${c.id}
    `)).rows.length;
    if (conflict) throw new PartnerError("Bu kullanıcı adı kullanılamıyor", 409);
    const account = (await tx.execute(sql`
      INSERT INTO partner_accounts(coupon_id,username,password_hash)
      VALUES(${c.id},${username},${passwordHash})
      ON CONFLICT(coupon_id) DO UPDATE SET username=EXCLUDED.username,password_hash=EXCLUDED.password_hash
      RETURNING *
    `)).rows[0] as any;
    await tx.execute(sql`DELETE FROM partner_sessions WHERE account_id=${account.id}`);
    return { profile: profile({ ...account, ...c, id: account.id, coupon_id: c.id }), token: await createPartnerSession(tx, account.id) };
  });
}

export async function loginPartner(identifier: string, password: string) {
  const rows = (await db.execute(sql`
    SELECT a.*,c.code,c.influencer_name,c.commission_type,c.commission_value
    FROM partner_accounts a JOIN coupons c ON c.id=a.coupon_id
    WHERE (a.username=lower(${identifier}) OR upper(c.code)=upper(${identifier}))
      AND c.is_influencer_code=true LIMIT 2
  `)).rows as any[];
  const a = rows.length === 1 ? rows[0] : null;
  const valid = a?.password_hash ? await bcrypt.compare(password, a.password_hash) : false;
  if (!a || !valid || !a.enabled) throw new PartnerError("Kullanıcı adı, kod veya şifre hatalı", 401);
  return db.transaction(async tx => {
    const latest = (await tx.execute(sql`SELECT * FROM partner_accounts WHERE id=${a.id} FOR UPDATE`)).rows[0] as any;
    if (!latest?.enabled || latest.password_hash !== a.password_hash) throw new PartnerError("Hesap bilgileri değişti. Tekrar giriş yapın", 401);
    return { profile: profile(a), token: await createPartnerSession(tx, a.id) };
  });
}

const attempts = new Map<string, { count: number; until: number }>();
export const partnerAuthLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  if (attempts.size > 5000) {
    attempts.forEach((value, key) => { if (value.until <= now) attempts.delete(key); });
    if (attempts.size > 5000) return res.status(429).json({ error: "Lütfen daha sonra tekrar deneyin" });
  }
  const key = req.ip || "unknown";
  const old = attempts.get(key);
  const entry = old && old.until > now ? old : { count: 0, until: now + 15 * 60_000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 40) {
    res.setHeader("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
    return res.status(429).json({ error: "Çok fazla deneme yaptınız. Bir süre sonra tekrar deneyin" });
  }
  next();
};

export const partnerSameOrigin: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    let invalid = req.get("sec-fetch-site") === "cross-site";
    if (origin) {
      try { invalid ||= new URL(origin).host !== req.get("host"); } catch { invalid = true; }
    }
    if (invalid) return res.status(403).json({ error: "Bu işlem için partner panelini kullanın" });
  }
  next();
};
