// Edge function: payments-webhook
// Receives provider events (Stripe / Paddle) and persists changes into:
//   - subscripciones_workspace
//   - pagos_workspace
//   - workspaces.plan_codigo (when subscription status changes)
//
// Skeleton: validates signature header is present, returns 200 to ACK,
// and logs the event. Replace the verify+dispatch block when wiring a provider.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Los webhooks los llama el proveedor (servidor a servidor): no se habilita CORS.
const corsHeaders: Record<string, string> = {};

const enc = new TextEncoder();
const TOLERANCE_SECONDS = 300;

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a), y = enc.encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

/** Stripe: header `t=<ts>,v1=<hmac>` sobre `${t}.${rawBody}`. Paddle Billing: `ts=<ts>;h1=<hmac>` igual. */
async function verifySignature(provider: string, header: string, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get(provider === "stripe" ? "STRIPE_WEBHOOK_SECRET" : "PADDLE_WEBHOOK_SECRET");
  if (!secret) return false; // fallar cerrado
  const parts = Object.fromEntries(
    header.split(/[,;]/).map((p) => p.trim().split("=") as [string, string]),
  );
  const ts = provider === "stripe" ? parts.t : parts.ts;
  const sig = provider === "stripe" ? parts.v1 : parts.h1;
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCE_SECONDS) return false; // anti-replay
  const sep = provider === "stripe" ? "." : ":";
  return safeEqual(await hmacHex(secret, `${ts}${sep}${rawBody}`), sig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSig = req.headers.get("stripe-signature");
  const paddleSig = req.headers.get("paddle-signature");
  const provider = stripeSig ? "stripe" : paddleSig ? "paddle" : "unknown";

  try {
    const rawBody = await req.text();

    if (provider === "unknown") {
      return new Response(JSON.stringify({ error: "unknown_provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificación de firma ANTES de parsear o escribir nada.
    const valid = await verifySignature(provider, (stripeSig ?? paddleSig)!, rawBody);
    if (!valid) {
      console.warn(`[payments-webhook] firma inválida provider=${provider}`);
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[payments-webhook] provider=${provider} type=${event?.type ?? event?.event_type ?? "unknown"}`);

    // TODO: dispatch by event.type and update subscripciones_workspace + pagos_workspace.
    // Example expected types:
    //   stripe: customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
    //   paddle: subscription.created/updated/canceled, transaction.completed

    // Acknowledge receipt — providers retry on non-2xx.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[payments-webhook] error", err);
    return new Response(JSON.stringify({ error: "internal_error", message: err?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
