import { NextResponse } from "next/server";
import { getMyBusiness } from "@/lib/loyalty/business";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/admin/http";

const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extensionFor(file: File): string | null {
  const byMime = ALLOWED[file.type];
  if (byMime) return byMime;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
    return ext === "jpeg" ? "jpg" : ext;
  }
  return null;
}

export async function POST(req: Request) {
  const { supabase, user, business } = await getMyBusiness();
  if (!user || !business) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const form = await req.formData().catch(() => null);
  const paymentId = String(form?.get("paymentId") ?? "").trim();
  const note = String(form?.get("note") ?? "").trim().slice(0, 300);
  const file = form?.get("file");
  if (!paymentId) return NextResponse.json({ error: "Falta el pago." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Subí el comprobante." }, { status: 400 });

  const ext = extensionFor(file);
  if (!ext) {
    return NextResponse.json({ error: "El comprobante debe ser PDF, JPG, PNG o WebP." }, { status: 400 });
  }
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El comprobante debe pesar entre 1 byte y 5 MB." }, { status: 400 });
  }

  const { data: payment } = await supabase
    .from("service_payments")
    .select("id,business_id,status,receipt_path")
    .eq("id", paymentId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
  if (payment.status === "paid") {
    return NextResponse.json({ error: "Ese período ya está pagado." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: bucket } = await admin.storage.getBucket("receipts");
  if (!bucket) {
    const { error: bucketError } = await admin.storage.createBucket("receipts", { public: false });
    if (bucketError && !bucketError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: `No se pudo preparar Storage: ${bucketError.message}` }, { status: 500 });
    }
  }

  const path = `${business.id}/${paymentId}-${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage.from("receipts").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type || (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`),
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: `No se pudo subir el comprobante: ${uploadError.message}` }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("service_payments")
    .update({
      status: "pending_review",
      method: "transferencia",
      note,
      receipt_path: path,
      receipt_name: file.name.slice(0, 160),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("business_id", business.id);
  if (updateError) {
    try {
      await admin.storage.from("receipts").remove([path]);
    } catch {
      // Best effort: el archivo huérfano no impide responder el error.
    }
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (payment.receipt_path && payment.receipt_path !== path) {
    try {
      await admin.storage.from("receipts").remove([payment.receipt_path]);
    } catch {
      // Best effort: el comprobante anterior puede quedar huérfano.
    }
  }

  return NextResponse.json({ ok: true });
}
