import { z } from "zod";

const planSchema = z.enum(["base", "pro"]);

const accessSchema = z
  .object({
    mode: z.enum(["invite", "password"]).default("invite"),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((v) => v.mode !== "password" || !!v.password, {
    message: "Ingresá una contraseña temporal de al menos 8 caracteres.",
  });

const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "El slug solo admite minúsculas, números y guiones.");

export const clientCreateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: slugSchema.optional(),
  ownerName: z.string().min(2).max(80),
  ownerEmail: z.string().email(),
  plan: planSchema.default("base"),
  allyId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).default(""),
  access: accessSchema,
});

export const clientUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  slug: slugSchema.optional(),
  plan: planSchema.optional(),
  allyId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).optional(),
});

export const clientStatusSchema = z
  .object({
    status: z.enum(["active", "suspended"]),
    reason: z.string().max(300).optional(),
  })
  .refine((v) => v.status !== "suspended" || !!v.reason?.trim(), {
    message: "Indicá el motivo de la suspensión.",
  });

export const clientDeleteSchema = z.object({
  confirmSlug: z.string().min(1),
  deleteOwnerAccount: z.boolean().default(true),
});

export const allyCreateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  legalName: z.string().max(120).default(""),
  taxId: z.string().max(30).default(""),
  contactName: z.string().max(80).default(""),
  email: z.string().email(),
  phone: z.string().max(30).default(""),
  commissionRate: z.number().min(0).max(100).default(0),
  notes: z.string().max(1000).default(""),
  access: accessSchema,
});

export const allyUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  legalName: z.string().max(120).optional(),
  taxId: z.string().max(30).optional(),
  contactName: z.string().max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export const allyStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().max(300).optional(),
});

export const paymentReviewSchema = z.object({
  action: z.literal("mark_paid"),
});

const bankText = (max: number) => z.string().trim().max(max).default("");

export const bankSettingsSchema = z
  .object({
    holder: z.string().trim().min(2, "Ingresá el titular de la cuenta.").max(80),
    bank: z.string().trim().min(2, "Ingresá el banco o billetera.").max(80),
    accountType: bankText(60),
    cbuCvu: bankText(40),
    alias: bankText(80),
    taxId: bankText(30),
    notes: bankText(500),
  })
  .refine((v) => v.alias || v.cbuCvu, {
    message: "Ingresá un alias o un CBU/CVU.",
    path: ["cbuCvu"],
  });
