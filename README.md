# Fidelización — Tarjetas digitales (MVP)

Next.js (App Router, TypeScript) + Supabase (Auth, Postgres, Storage). Sistema de diseño de `CLAUDE.md` (dark theme, tokens exactos).

## Puesta en marcha

1. `npm install`
2. Copiá `.env.example` a `.env.local` y cargá las claves de Supabase.
3. **Migración DB:** en Supabase Dashboard > SQL Editor, ejecutá `supabase/migrations/001_loyalty.sql`.
   Crea `businesses`, `loyalty_programs`, `loyalty_members`, `loyalty_cards`, `loyalty_transactions` + RLS + RPC `loyalty_earn` / `loyalty_redeem`.
4. **Storage:** creá el bucket público `logos` (para logos de tarjetas).
5. `npm run dev` → http://localhost:3000

## Google Wallet (Loyalty)

1. Creá un **emisor (Issuer)** en la consola Google Pay & Wallet y anotá el **Issuer ID**.
2. En Google Cloud: habilitá la **Google Wallet API** y creá una **service account** con acceso al emisor.
3. Variables (solo servidor, nunca al repo):
   `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_WALLET_PRIVATE_KEY`, `NEXT_PUBLIC_APP_URL`.
4. **Modo demo:** mientras el emisor esté en demo, solo usuarios de prueba (agregados en la consola) pueden guardar tarjetas.
   Para producción hay que **solicitar acceso de publicación** a Google.
5. Sin credenciales, la plataforma funciona igual con la **tarjeta web** (`/t/[token]`); al publicar verás un aviso.

Código: `lib/wallet/google.ts` → `upsertClass`, `createSaveLink`, `updateObject`.
Tras cada sello/canje se hace PATCH al objeto; si falla, la transacción **no se revierte**: queda `pending_sync=true` y se reintenta.

## Flujo punta a punta

1. Negocio se registra en `/registro` → crea su negocio → `/panel`.
2. Crea tarjeta (asistente) → Publicar → QR en `/panel/[id]/qr`.
3. Cliente escanea → `/f/[slug]` → se registra → botón Wallet + tarjeta web `/t/[token]`.
4. Empleado en `/panel/escanear` suma sellos (o busca por teléfono) → la tarjeta se actualiza.
5. Al llegar a la meta → premio → Canjear → queda en historial.

## Avisos push (Web Push / VAPID)

1. Ejecutá `supabase/migrations/004_loyalty_push.sql` (tabla `push_subscriptions`).
2. Claves VAPID en `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
   (generar propias con `npx web-push generate-vapid-keys`).
3. El cliente toca "Avisame de mis premios" en su tarjeta web y queda suscripto.
4. El negocio envía desde **/panel/avisos** (difusión por tarjeta a suscriptos).
   Al tocar el aviso se abre la tarjeta del cliente. Suscripciones vencidas (410) se limpian solas.
5. Requiere HTTPS en producción (localhost vale para probar). En iPhone solo llega si la
   tarjeta se instaló como app (Agregar a pantalla de inicio), por limitación de Apple.

## Futuro (no implementado)

- **Apple Wallet:** requiere cuenta paga Apple Developer, Pass Type ID certificado y web service con APNs.
  Reservar campos `apple_serial` en `loyalty_cards` cuando se implemente.
- **Cupones:** agregar `coupon` a `card_type` + UI (hoy deshabilitado con "Próximamente").
- Campañas, geolocalización, Smart Tap/NFC en caja, código de un solo uso, roles múltiples (`business_members`), cobros.
- n8n: seteá `N8N_LOYALTY_WEBHOOK_URL` y cada evento `earn/redeem/enroll/adjust` llega como POST.

## Estructura

- `app/` páginas + `app/api/loyalty/` endpoints
- `components/ui/` Button, Input, Card, Table
- `components/loyalty/` ProgramForm, CardPreview, QrView, Scanner, Stats, EnrollForm, AdjustForm
- `lib/supabase/` client, server, admin · `lib/wallet/google.ts` · `lib/loyalty/` schemas, business, notify
- `supabase/migrations/001_loyalty.sql`
