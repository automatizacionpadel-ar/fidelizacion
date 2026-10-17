import { z } from "zod";

export const subscribeSchema = z.object({
  card_token: z.string().min(10).max(128),
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(10).max(500),
  auth: z.string().min(10).max(500),
});

export const sendPushSchema = z.object({
  card_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  title: z.string().min(2).max(80),
  body: z.string().min(2).max(200),
  // wallet = notificación nativa de la app de Google Wallet (no depende del
  // navegador). push = Web Push (requiere que Chrome esté vivo). both = ambos.
  channel: z.enum(["wallet", "push", "both"]).default("wallet"),
}).refine((d) => d.card_id || d.program_id, { message: "Elegí un cliente o un programa." });
