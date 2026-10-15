"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR pelado, sin logo al centro.
export function QrWithLogo({
  value,
  logoUrl: _logoUrl,
  size = 200,
  onReady,
}: {
  value: string;
  logoUrl?: string | null;
  size?: number;
  onReady?: (dataUrl: string) => void;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const qrUrl = await QRCode.toDataURL(value, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        if (alive) {
          setSrc(qrUrl);
          onReady?.(qrUrl);
        }
      } catch {
        // ante cualquier error, no dejar sin QR
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!src) {
    return (
      <div
        style={{
          width: size,
          maxWidth: "100%",
          aspectRatio: "1/1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
        }}
      >
        ...
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR de tu tarjeta" style={{ width: size, maxWidth: "100%", height: "auto", aspectRatio: "1/1", display: "block" }} />;
}
