"use client";

import { useState } from "react";
import { CardShell } from "./CardShell";
import { CardFace } from "./CardFace";
import { RewardCelebration } from "./RewardCelebration";

export type VirtualCardProps = {
  businessName: string;
  cardTitle: string;
  memberName: string;
  cardType: "stamps" | "points";
  goal: number;
  balance: number;
  rewardsAvailable: number;
  rewardDescription: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl?: string | null;
  stampIcon?: string | null;
  stampImageUrl?: string | null;
  fontFamily?: string | null;
  template?: string | null;
  earnedNow?: number;
  wonNow?: number;
  fill?: boolean;
};

export function VirtualCard(p: VirtualCardProps) {
  const wonNow = p.wonNow ?? 0;
  const [dismissedWon, setDismissedWon] = useState(0);
  const celebrate = wonNow > 0 && dismissedWon !== wonNow;

  return (
    <>
      <CardShell
        template={p.template}
        backgroundColor={p.backgroundColor}
        textColor={p.textColor}
        accentColor={p.accentColor}
        fontFamily={p.fontFamily}
        radius={20}
        padding={22}
        shadow="0 24px 60px rgba(0,0,0,0.48)"
        fill={p.fill}
      >
        <CardFace
          businessName={p.businessName}
          cardTitle={p.cardTitle}
          memberName={p.memberName}
          cardType={p.cardType}
          goal={p.goal}
          balance={p.balance}
          rewardsAvailable={p.rewardsAvailable}
          rewardDescription={p.rewardDescription}
          accentColor={p.accentColor}
          logoUrl={p.logoUrl}
          stampIcon={p.stampIcon}
          stampImageUrl={p.stampImageUrl}
          earnedNow={p.earnedNow}
          wonNow={p.wonNow}
        />
      </CardShell>

      {celebrate ? (
        <RewardCelebration
          accentColor={p.accentColor}
          backgroundColor={p.backgroundColor}
          rewardDescription={p.rewardDescription}
          rewardsAvailable={p.rewardsAvailable}
          memberName={p.memberName}
          onClose={() => setDismissedWon(wonNow)}
        />
      ) : null}
    </>
  );
}
