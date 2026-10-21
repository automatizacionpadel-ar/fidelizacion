import { CardShell } from "./CardShell";
import { CardFace } from "./CardFace";

export type PreviewProps = {
  businessName?: string;
  memberName?: string;
  cardTitle: string;
  cardType: "stamps" | "points";
  goal: number;
  balance?: number;
  rewardDescription: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl?: string | null;
  stampIcon?: string;
  stampImageUrl?: string | null;
  fontFamily?: string;
  template?: string | null;
};

export function CardPreview(p: PreviewProps) {
  const exampleBalance = p.cardType === "points" ? Math.round(p.goal * 0.65) : Math.min(7, p.goal - 1);
  const balance = Math.min(p.balance ?? exampleBalance, p.goal);

  return (
    <CardShell
      template={p.template}
      backgroundColor={p.backgroundColor}
      textColor={p.textColor}
      accentColor={p.accentColor}
      fontFamily={p.fontFamily}
      radius={20}
      padding={22}
      shadow="0 24px 60px rgba(0,0,0,0.48)"
    >
      <CardFace
        businessName={p.businessName ?? ""}
        memberName={p.memberName}
        cardTitle={p.cardTitle || "Tu tarjeta"}
        cardType={p.cardType}
        goal={p.goal}
        balance={balance}
        rewardsAvailable={0}
        rewardDescription={p.rewardDescription}
        accentColor={p.accentColor}
        logoUrl={p.logoUrl}
        stampIcon={p.stampIcon}
        stampImageUrl={p.stampImageUrl}
      />
    </CardShell>
  );
}
