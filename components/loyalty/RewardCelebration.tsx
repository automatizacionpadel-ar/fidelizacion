"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const CONFETTI = [
  { left: "6%", delay: "0s", duration: "2.8s", drift: "18px", color: "#FFD166", size: 9 },
  { left: "14%", delay: "0.35s", duration: "3.4s", drift: "-22px", color: "#FFFFFF", size: 7 },
  { left: "23%", delay: "0.1s", duration: "2.6s", drift: "30px", color: "#7AB619", size: 8 },
  { left: "33%", delay: "0.7s", duration: "3.1s", drift: "-14px", color: "#FFD166", size: 10 },
  { left: "42%", delay: "0.2s", duration: "2.9s", drift: "24px", color: "#7AB619", size: 7 },
  { left: "51%", delay: "0.9s", duration: "3.5s", drift: "-30px", color: "#FFFFFF", size: 9 },
  { left: "61%", delay: "0.45s", duration: "2.7s", drift: "16px", color: "#FFD166", size: 8 },
  { left: "70%", delay: "0.05s", duration: "3.2s", drift: "-20px", color: "#7AB619", size: 10 },
  { left: "79%", delay: "0.6s", duration: "2.9s", drift: "26px", color: "#FFFFFF", size: 7 },
  { left: "88%", delay: "0.25s", duration: "3.3s", drift: "-18px", color: "#FFD166", size: 9 },
  { left: "94%", delay: "0.8s", duration: "2.6s", drift: "12px", color: "#7AB619", size: 8 },
  { left: "19%", delay: "1.1s", duration: "3.6s", drift: "20px", color: "#FFFFFF", size: 6 },
  { left: "47%", delay: "0.5s", duration: "3s", drift: "-26px", color: "#FFD166", size: 7 },
  { left: "74%", delay: "1.2s", duration: "3.4s", drift: "22px", color: "#7AB619", size: 6 },
];

export function RewardCelebration({
  accentColor,
  backgroundColor,
  rewardDescription,
  rewardsAvailable,
  memberName,
  onClose,
}: {
  accentColor: string;
  backgroundColor: string;
  rewardDescription: string;
  rewardsAvailable: number;
  memberName?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(onClose, 12000);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [onClose]);

  const firstName = memberName?.trim().split(" ")[0];

  return (
    <div
      className="celebration-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Premio desbloqueado"
      onClick={onClose}
    >
      <div className="confetti-layer" aria-hidden="true">
        {CONFETTI.map((piece, index) => (
          <span
            key={index}
            className="confetti-piece"
            style={
              {
                left: piece.left,
                width: piece.size,
                height: piece.size * 1.7,
                background: piece.color === "#7AB619" ? accentColor : piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                "--drift": piece.drift,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div
        className="celebration-card"
        onClick={(event) => event.stopPropagation()}
        style={{
          borderColor: `${accentColor}66`,
          background: `linear-gradient(165deg, ${backgroundColor}f2 0%, ${backgroundColor} 58%, ${accentColor}30 100%)`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.14)`,
        }}
      >
        <div className="celebration-glow" style={{ background: accentColor }} />

        <div className="celebration-badge" style={{ borderColor: `${accentColor}66`, background: `${accentColor}1f` }}>
          <span className="celebration-trophy" aria-hidden="true">
            🏆
          </span>
          <span className="celebration-spark celebration-spark-1" style={{ color: accentColor }}>✦</span>
          <span className="celebration-spark celebration-spark-2" style={{ color: accentColor }}>✦</span>
          <span className="celebration-spark celebration-spark-3" style={{ color: accentColor }}>✦</span>
        </div>

        <p className="celebration-eyebrow" style={{ color: accentColor }}>
          PREMIO DESBLOQUEADO
        </p>
        <h2 className="celebration-title">¡Felicidades{firstName ? `, ${firstName}` : ""}!</h2>
        <p className="celebration-subtitle">Completaste tu tarjeta y ganaste:</p>

        <div
          className="celebration-reward"
          style={{ borderColor: `${accentColor}55`, background: `${accentColor}16` }}
        >
          {rewardDescription || "Tu premio"}
        </div>

        <p className="celebration-count">
          Tenés <strong style={{ color: accentColor }}>{rewardsAvailable}</strong>{" "}
          premio{rewardsAvailable === 1 ? "" : "s"} disponible{rewardsAvailable === 1 ? "" : "s"}
        </p>

        <button
          type="button"
          className="celebration-button"
          style={{ background: accentColor }}
          onClick={onClose}
          autoFocus
        >
          Ver mi tarjeta
        </button>
        <p className="celebration-hint">Mostrá esta pantalla en el local para canjearlo.</p>
      </div>
    </div>
  );
}
