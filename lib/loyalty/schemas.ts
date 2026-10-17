import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(2).max(80),
  card_title: z.string().min(2).max(80),
  branch_id: z.string().uuid().nullable().optional(),
  card_type: z.enum(["stamps", "points"]),
  goal: z.number().int().min(2).max(10000),
  earn_unit: z.enum(["visit", "amount_spent"]),
  points_per_amount: z.number().positive().nullable().optional(),
  amount_step: z.number().positive().nullable().optional(),
  reward_type: z.enum(["free_item", "discount_percent", "cashback"]),
  reward_description: z.string().min(2).max(140),
  reward_value: z.number().nullable().optional(),
  terms: z.string().max(500).default(""),
  logo_url: z.string().url().nullable().optional(),
  wallet_logo_url: z.string().url().nullable().optional(),
  hero_image_url: z.string().url().nullable().optional(),
  background_color: z.string().default("#2A2A29"),
  text_color: z.string().default("#F0F0EE"),
  accent_color: z.string().default("#7AB619"),
  stamp_icon: z.string().min(1).max(10).default("✓"),
  stamp_image_url: z.string().url().nullable().optional(),
  font_family: z.enum(["system", "inter", "poppins", "montserrat", "playfair"]).default("system"),
  template: z.enum(["moderno", "clasico", "glass", "futurista"]).default("moderno"),
  stamp_cooldown_minutes: z.number().int().min(0).max(1440).default(60),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional(),
});

export const earnSchema = z.object({
  card_id: z.string().uuid().optional(),
  token: z.string().min(10).max(128).optional(),
  amount_spent: z.number().positive().nullable().optional(),
  source: z.enum(["scan", "phone_lookup", "manual", "auto_scan"]).default("scan"),
  note: z.string().max(300).nullable().optional(),
}).refine((d) => d.card_id || d.token, { message: "Falta card_id o token." });

export const redeemSchema = z.object({
  card_id: z.string().uuid().optional(),
  token: z.string().min(10).max(128).optional(),
  source: z.enum(["scan", "phone_lookup", "manual"]).default("scan"),
  note: z.string().max(300).nullable().optional(),
}).refine((d) => d.card_id || d.token, { message: "Falta card_id o token." });

export const enrollSchema = z.object({
  slug: z.string().min(2).max(60),
  name: z.string().min(2).max(80).nullable().optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  // Identidad alternativa: token de otra tarjeta del mismo negocio (sin reingresar datos).
  card_token: z.string().min(10).max(128).optional(),
  // honeypot anti-bots
  website: z.string().max(0).optional(),
}).refine((d) => d.card_token || d.phone, { message: "Falta identificación." });

export const adjustSchema = z.object({
  amount: z.number().int().min(-100).max(100).refine((v) => v !== 0, { message: "El ajuste no puede ser 0." }),
  note: z.string().min(3, "La nota es obligatoria.").max(300),
});
