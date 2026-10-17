// Identificador de dispositivo por programa. Guarda el token de la tarjeta del
// cliente para reconocerlo en la próxima visita sin pedirle nada. Se lee en el
// server component de /n/[programSlug]; nunca se expone al JS del cliente.
export function deviceCookieName(programId: string) {
  return `lc_${programId}`;
}

// 2 años.
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 730;

export function deviceCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  };
}
