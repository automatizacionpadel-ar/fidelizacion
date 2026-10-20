"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { QrIcon } from "@/components/panel/icons";

export function AllyQrMenu({
  allyName,
  url,
  qrDataUrl,
  downloadName,
}: {
  allyName: string;
  url: string;
  qrDataUrl: string;
  downloadName: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  function close() {
    setOpen(false);
    setCopied(false);
    setCopyError(false);
  }

  async function copyUrl() {
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <QrIcon size={18} />
        Ver QR
      </Button>

      <Modal open={open} title="QR de registro" onClose={close} maxWidth={440}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <p style={{ fontSize: 14, color: "#9A9A96", textAlign: "center", lineHeight: 1.5 }}>
            Mostralo a tus clientes para que se registren y queden asociados a{" "}
            <strong style={{ color: "#F0F0EE" }}>{allyName}</strong>.
          </p>

          <div style={{ background: "#F0F0EE", borderRadius: 14, padding: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR de registro de ${allyName}`}
              width={240}
              height={240}
              style={{ display: "block", width: 240, height: 240 }}
            />
          </div>

          <div style={{ width: "100%" }}>
            <label
              htmlFor="ally-referral-url"
              style={{ display: "block", fontSize: 12, color: "#9A9A96", marginBottom: 6 }}
            >
              URL del aliado
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="ally-referral-url"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: "#20201F",
                  color: "#F0F0EE",
                  border: "1px solid #3D3D3B",
                  borderRadius: 10,
                  padding: "9px 12px",
                  fontSize: 13,
                }}
              />
              <Button type="button" variant="secondary" onClick={copyUrl} style={{ flexShrink: 0 }}>
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            {copyError ? (
              <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
                No se pudo copiar. Seleccioná el texto y copialo manualmente.
              </p>
            ) : null}
          </div>

          <a
            href={qrDataUrl}
            download={downloadName}
            style={{
              width: "100%",
              minHeight: 44,
              borderRadius: 10,
              padding: "10px 16px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#7AB619",
              color: "#20201F",
              border: "1px solid #7AB619",
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Descargar QR
          </a>
        </div>
      </Modal>
    </>
  );
}
