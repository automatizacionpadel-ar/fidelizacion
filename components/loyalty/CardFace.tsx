import type { CSSProperties } from "react";
import { CardProgress } from "./CardShell";
import { Stamp } from "./Stamp";

export type CardFaceProps = {
  businessName: string;
  cardTitle: string;
  memberName?: string;
  cardType: "stamps" | "points";
  goal: number;
  balance: number;
  rewardsAvailable: number;
  rewardDescription: string;
  accentColor: string;
  logoUrl?: string | null;
  stampIcon?: string | null;
  stampImageUrl?: string | null;
  earnedNow?: number;
  wonNow?: number;
};

function balancedStampColumns(total: number): number {
  if (total <= 5) return total;
  if (total === 7) return 7;
  for (let columns = 5; columns >= 2; columns -= 1) {
    if (total % columns === 0 && total / columns <= 4) return columns;
  }
  return 5;
}

export function CardFace(p: CardFaceProps) {
  const filled = Math.min(p.balance, p.goal);
  const label = p.cardType === "stamps" ? "sellos" : "puntos";
  const unit = p.cardType === "stamps" ? "sello" : "punto";
  const icon = p.stampIcon || "✓";
  const remaining = Math.max(0, p.goal - filled);
  const showBusiness =
    p.businessName.trim() !== "" &&
    p.businessName.trim().toLowerCase() !== p.cardTitle.trim().toLowerCase();
  const justEarned = (p.earnedNow ?? 0) > 0 && (p.wonNow ?? 0) === 0;
  const newStampIndex = justEarned && p.cardType === "stamps" ? Math.min(19, Math.max(0, filled - 1)) : -1;

  return (
    <>
      <div className="card-topline">
        <span className="card-brand">
          <span
            className="card-brand-dot"
            style={{ background: p.accentColor, boxShadow: `0 0 10px ${p.accentColor}` }}
          />
          <span className="card-brand-name">{showBusiness ? p.businessName : "Tarjeta de fidelidad"}</span>
        </span>
        <span
          className="card-type-pill"
          style={{ borderColor: `${p.accentColor}66`, color: p.accentColor }}
        >
          {p.cardType === "stamps" ? "SELLOS" : "PUNTOS"}
        </span>
      </div>

      <div className="card-hero">
        <div
          className="card-logo-frame"
          style={{
            borderColor: `${p.accentColor}3d`,
            background: `linear-gradient(145deg, ${p.accentColor}1f, rgba(255,255,255,0.03))`,
          }}
        >
          {p.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logoUrl} alt={`Logo de ${p.businessName || p.cardTitle}`} className="card-logo-img" />
          ) : (
            <span className="card-logo-letter" style={{ color: p.accentColor }}>
              {(p.businessName || p.cardTitle || "F")[0]}
            </span>
          )}
        </div>
        <div className="card-heading">
          <p className="card-eyebrow" style={{ color: p.accentColor }}>
            TU TARJETA
          </p>
          <h2 className="card-title">{p.cardTitle}</h2>
          {p.memberName ? <p className="card-member">Hola, {p.memberName.split(" ")[0]}</p> : null}
        </div>
      </div>

      <div
        className="card-reward"
        style={{
          borderColor: `${p.accentColor}8c`,
          background: `linear-gradient(120deg, ${p.accentColor}3d 0%, ${p.accentColor}14 46%, rgba(255,255,255,0.045) 100%)`,
          boxShadow: `0 16px 36px -20px ${p.accentColor}dd, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      >
        <div
          className="card-reward-medal"
          style={{
            borderColor: `${p.accentColor}66`,
            background: `${p.accentColor}24`,
            boxShadow: `0 0 24px ${p.accentColor}30, inset 0 1px 0 rgba(255,255,255,0.18)`,
          }}
        >
          <span className="card-reward-icon" aria-hidden="true">
            🎁
          </span>
        </div>
        <div className="card-reward-copy">
          <div className="card-reward-kicker">
            <p className="card-reward-label" style={{ color: p.accentColor }}>
              TU PREMIO
            </p>
            <span className="card-reward-rule" style={{ background: `linear-gradient(90deg, ${p.accentColor}aa, transparent)` }} />
          </div>
          <p className="card-reward-text">{p.rewardDescription || "—"}</p>
          <p className="card-reward-hint">Al completar tu tarjeta</p>
        </div>
        <span className="card-reward-spark" style={{ color: p.accentColor }} aria-hidden="true">
          ✦
        </span>
      </div>

      <div className="card-progress-block">
        <div className="card-count-row">
          <div>
            <span className="card-count">{filled}</span>
            <span className="card-goal">/{p.goal}</span>
            <span className="card-unit">{label.toUpperCase()}</span>
          </div>
          <span
            className="card-remaining"
            style={{ background: `${p.accentColor}18`, color: p.accentColor }}
          >
            {remaining > 0 ? `Faltan ${remaining} ${remaining === 1 ? unit : label}` : "¡Completa!"}
          </span>
        </div>

        <div className="card-progress-body">
          {p.cardType === "points" ? (
            <CardProgress
              balance={filled}
              goal={p.goal}
              accentColor={p.accentColor}
              animate={justEarned}
              fromBalance={Math.max(0, p.balance - (p.earnedNow ?? 0))}
            />
          ) : (
            <div
              className="card-stamp-grid"
              style={
                {
                  gridTemplateColumns: `repeat(${balancedStampColumns(Math.min(p.goal, 20))}, minmax(0, 1fr))`,
                  "--stamp-accent": p.accentColor,
                } as CSSProperties
              }
            >
              {Array.from({ length: Math.min(p.goal, 20) }).map((_, i) => (
                <span key={i} className={`card-stamp-cell${i < filled ? " is-earned" : ""}`}>
                  <Stamp
                    earned={i < filled}
                    icon={icon}
                    imageUrl={p.stampImageUrl}
                    size={34}
                    isNew={i === newStampIndex}
                    accentColor={p.accentColor}
                  />
                </span>
              ))}
              {p.goal > 20 && <span className="card-stamp-more">+{p.goal - 20} más</span>}
            </div>
          )}
        </div>
      </div>

      {p.rewardsAvailable > 0 ? (
        <div
          className="card-rewards-banner"
          style={
            {
              background: `linear-gradient(100deg, ${p.accentColor}, ${p.accentColor}dd 45%, #ffffff 50%, ${p.accentColor}dd 55%, ${p.accentColor})`,
              backgroundSize: "220% 100%",
              color: "#171717",
            } as CSSProperties
          }
        >
          ✨ Tenés {p.rewardsAvailable} premio{p.rewardsAvailable > 1 ? "s" : ""} para canjear
        </div>
      ) : null}

      {justEarned ? (
        <div
          className="card-earned-toast"
          style={{
            borderColor: `${p.accentColor}66`,
            background: `${p.accentColor}1c`,
            color: p.accentColor,
          }}
        >
          <span className="card-earned-plus">+{p.earnedNow}</span>
          {p.earnedNow === 1 ? unit : label} para tu tarjeta
        </div>
      ) : null}

      <div className="card-footer">
        <span className="card-member-chip">
          <span className="card-member-avatar" style={{ background: `${p.accentColor}2b`, color: p.accentColor }}>
            {(p.memberName || "M")[0].toUpperCase()}
          </span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.memberName || "Miembro"}
          </span>
        </span>
        <span className="card-live">
          <span className="card-live-dot" style={{ background: p.accentColor, boxShadow: `0 0 8px ${p.accentColor}` }} />
          ACTIVA
        </span>
      </div>
    </>
  );
}
