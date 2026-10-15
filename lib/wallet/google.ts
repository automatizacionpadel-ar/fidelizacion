// Módulo Google Wallet (Loyalty) — todo del lado servidor.
// Funciones: upsertClass(program), createSaveLink(card), updateObject(card).
// Si faltan las credenciales, las funciones de escritura lanzan un error claro
// y createSaveLink devuelve null (la tarjeta web sigue funcionando como fallback).

type ProgramLike = {
  id: string;
  card_title: string;
  background_color?: string | null;
  logo_url?: string | null;
  wallet_logo_url?: string | null;
  hero_image_url?: string | null;
  reward_description?: string | null;
  goal?: number | null;
};

type CardLike = {
  id: string;
  program_id: string;
  balance: number;
  rewards_available: number;
  token: string;
  member_name?: string | null;
  goal?: number | null;
  stamp_icon?: string | null;
  // Hero dinámica por tarjeta (logos/cards/{cardId}.png con ?v=).
  // Si está, Google la muestra en lugar de la hero de la clase.
  hero_image_url?: string | null;
};

// NOTA: la API de LoyaltyClass solo acepta hexBackgroundColor. No existen
// campos de color de texto ni de acento: Google calcula el contraste solo.
// La paleta completa (text_color, accent_color) vive en la tarjeta web /t
// y en la hero dinámica por tarjeta (que sí puede usar los colores del negocio).
// El progreso vive DENTRO de la hero dinámica por tarjeta
// (logos/cards/{cardId}.png): no se mandan módulos de texto por objeto.
// Quedan: la fila nativa de puntos (loyaltyPoints) y el módulo "Premio"
// a nivel de clase. Así no hay texto duplicado debajo de la imagen.
function objectTextModules(_card: CardLike) {
  return [];
}

function config() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return { issuerId, clientEmail, privateKey };
}

export function walletConfigured() {
  const { issuerId, clientEmail, privateKey } = config();
  return Boolean(issuerId && clientEmail && privateKey);
}

function classId(programId: string) {
  return `${config().issuerId}.${programId.replace(/-/g, "")}`;
}

function objectId(cardId: string) {
  return `${config().issuerId}.${cardId.replace(/-/g, "")}`;
}

async function accessToken(): Promise<string> {
  const { clientEmail, privateKey } = config();
  if (!clientEmail || !privateKey) throw new Error("Faltan credenciales de Google Wallet.");
  // JWT de service account (RS256) firmado con WebCrypto — sin dependencias extra.
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc(header)}.${enc(claims)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(
      privateKey.replace(/-----.*-----/g, "").replace(/\s/g, ""),
      "base64"
    ),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = Buffer.from(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(unsigned)
    )
  ).toString("base64url");
  const assertion = `${unsigned}.${sig}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error("No se pudo autenticar con Google Wallet.");
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function upsertClass(program: ProgramLike) {
  const { issuerId } = config();
  if (!issuerId) throw new Error("Falta GOOGLE_WALLET_ISSUER_ID.");
  const token = await accessToken();
  const id = classId(program.id);
  const body = {
    id,
    issuerName: program.card_title,
    programName: program.card_title,
    reviewStatus: "UNDER_REVIEW",
    // Logo cuadrado de Wallet si existe, si no el logo libre de la web.
    // Google lo recorta en círculo: ideal PNG 660×660 con 15% de margen.
    programLogo: (program.wallet_logo_url ?? program.logo_url)
      ? { sourceUri: { uri: (program.wallet_logo_url ?? program.logo_url)! } }
      : undefined,
    // Banner full-width del frente de la tarjeta (100% ancho).
    // Óptimo: PNG 1032×812 (~5:4). Si no hay, Google muestra un fallback.
    heroImage: program.hero_image_url
      ? { sourceUri: { uri: program.hero_image_url } }
      : undefined,
    hexBackgroundColor: (program.background_color ?? "#2A2A29").replace("#", "#"),
    rewardsTierLabel: "Sellos",
    rewardsTier: `Meta: ${program.goal ?? ""}`,
    textModulesData: [
      {
        header: "Premio",
        body: program.reward_description ?? "",
        id: "premio",
      },
    ],
  };
  // Upsert real: GET -> PUT (update) si existe, POST (insert) si no existe.
  // PUT directo a una clase inexistente devuelve 404 en Wallet API.
  const getRes = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const res =
    getRes.ok || getRes.status !== 404
      ? await fetch(
          `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/${id}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify(body),
          }
        )
      : await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google Wallet rechazó la clase: ${t.slice(0, 300)}`);
  }
  return id;
}

export async function createSaveLink(card: CardLike): Promise<string | null> {
  const { issuerId, clientEmail, privateKey } = config();
  if (!issuerId || !clientEmail || !privateKey) return null;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    aud: "google",
    typ: "savetowallet",
    iat: now,
    origins: [],
    payload: {
      loyaltyObjects: [
        {
          id: objectId(card.id),
          classId: classId(card.program_id),
          state: "ACTIVE",
          accountName: card.member_name ?? "Cliente",
          // Sin loyaltyPoints a propósito: el progreso vive solo en la hero
          // generada por tarjeta (sin números ni filas nativas).
          textModulesData: objectTextModules(card),
          heroImage: card.hero_image_url
            ? { sourceUri: { uri: card.hero_image_url } }
            : undefined,
          barcode: { type: "QR_CODE", value: card.token },
        },
      ],
    },
  };
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(privateKey.replace(/-----.*-----/g, "").replace(/\s/g, ""), "base64"),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = Buffer.from(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned))
  ).toString("base64url");
  return `https://pay.google.com/gp/v/save/${unsigned}.${sig}`;
}

export async function updateObject(card: CardLike) {
  // Actualiza hero en Wallet (el progreso vive en la imagen, sin filas nativas).
  // Si falla, el llamador NO revierte la transacción: marca pending_sync y
  // reintenta después.
  const token = await accessToken();
  const patch: Record<string, unknown> = {
    textModulesData: objectTextModules(card),
  };
  if (card.hero_image_url) {
    patch.heroImage = { sourceUri: { uri: card.hero_image_url } };
  }
  const res = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId(card.id)}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Wallet PATCH falló: ${(await res.text()).slice(0, 200)}`);
}
