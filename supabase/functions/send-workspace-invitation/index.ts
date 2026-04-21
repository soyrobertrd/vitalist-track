import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  workspace_id: string;
  email: string;
  role: "admin" | "member";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Cliente con auth del usuario para verificar permisos via RLS
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: InviteRequest = await req.json();
    const { workspace_id, email, role } = body;

    if (!workspace_id || !email || !role) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar admin del workspace via RPC con auth del usuario
    const { data: isAdmin } = await supabaseUser.rpc("is_workspace_admin", {
      _user_id: user.id,
      _workspace_id: workspace_id,
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Sin permisos para invitar" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Cliente con service key para insertar invitación e leer workspace
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Verificar que el email no sea ya miembro (busca via profiles)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      const { data: existingMember } = await supabaseAdmin
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspace_id)
        .eq("user_id", existingProfile.id)
        .maybeSingle();
      if (existingMember) {
        return new Response(JSON.stringify({ error: "El usuario ya es miembro de la organización" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Revocar invitaciones pendientes previas para este email/workspace
    await supabaseAdmin
      .from("workspace_invitations")
      .update({ estado: "revocada" })
      .eq("workspace_id", workspace_id)
      .ilike("email", email.trim())
      .eq("estado", "pendiente");

    // Crear nueva invitación
    const { data: invitation, error: inviteErr } = await supabaseAdmin
      .from("workspace_invitations")
      .insert({
        workspace_id,
        email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
      })
      .select("token, expires_at")
      .single();

    if (inviteErr) throw inviteErr;

    // Obtener nombre del workspace e inviter
    const [{ data: ws }, { data: inviterProfile }] = await Promise.all([
      supabaseAdmin.from("workspaces").select("nombre").eq("id", workspace_id).single(),
      supabaseAdmin.from("profiles").select("nombre, apellido").eq("id", user.id).maybeSingle(),
    ]);

    const inviterName = inviterProfile
      ? `${inviterProfile.nombre || ""} ${inviterProfile.apellido || ""}`.trim() || user.email
      : user.email;

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://vitalist-track.lovable.app";
    const acceptUrl = `${origin}/aceptar-invitacion?token=${invitation.token}`;

    // Enviar email
    const resend = new Resend(resendKey);
    const roleLabel = role === "admin" ? "Administrador" : "Miembro";

    await resend.emails.send({
      from: "Vitalist Track <onboarding@resend.dev>",
      to: [email],
      subject: `${inviterName} te invitó a unirte a ${ws?.nombre || "una organización"}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
          <h1 style="font-size: 22px; margin: 0 0 16px;">Te invitaron a una organización</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #444;">
            <strong>${inviterName}</strong> te invitó a unirte a <strong>${ws?.nombre || "una organización"}</strong> en Vitalist Track como <strong>${roleLabel}</strong>.
          </p>
          <div style="margin: 28px 0;">
            <a href="${acceptUrl}"
               style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Aceptar invitación
            </a>
          </div>
          <p style="font-size: 13px; color: #777; line-height: 1.5;">
            Si no tienes cuenta, podrás crear una con este mismo correo electrónico (${email}) y la invitación se vinculará automáticamente.
          </p>
          <p style="font-size: 12px; color: #999; margin-top: 32px;">
            Esta invitación expira el ${new Date(invitation.expires_at).toLocaleDateString("es-DO", { dateStyle: "long" })}.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, token: invitation.token }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("send-workspace-invitation error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
