import { RegisterForm } from "@/components/auth/RegisterForm";
import { getActiveReferralAlly, normalizeAllyId } from "@/lib/auth/referrals";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ aliado?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.aliado) ? params.aliado[0] : params.aliado;
  const referral = await getActiveReferralAlly(normalizeAllyId(raw));

  return <RegisterForm referral={referral} />;
}
