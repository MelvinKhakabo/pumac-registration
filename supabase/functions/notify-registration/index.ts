import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (record.payment_status !== "paid") {
      return new Response("Not a paid registration, skipping.", { status: 200 });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // Map program slug to full name
    const programNames: Record<string, string> = {
      "training": "PUMaC Training Program",
      "mock-test": "PUMaC Mock Test",
      "competition": "PUMaC Competition",
    };

    // We need to look up the program slug from the program_id
    // Since we only have program_id on the record, we use a fallback label
    // The program type is embedded in the paystack_reference prefix isn't available here
    // so we derive it from the paystack_reference pattern or use notes field
    // Best approach: check which junction table has a record for this registration
    // For simplicity we label based on total_usd ranges as a fallback
    // Actually the cleanest is to fetch from programs table via Supabase REST
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let programLabel = "PUMaC Program";

    if (supabaseUrl && supabaseKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/programs?id=eq.${record.program_id}&select=slug`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
        }
      );
      const programs = await res.json();
      if (programs?.[0]?.slug) {
        programLabel = programNames[programs[0].slug] || "PUMaC Program";
      }
    }

    // ── Email 1: Team notification ──
    const teamEmailBody = `
      <h2>New PUMaC Registration 🎉</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Student Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.student_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Student Age</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.student_age}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>School</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.current_school}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Country</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.country}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Program</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${programLabel}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Parent Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.parent_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Parent Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.parent_email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>WhatsApp</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.parent_whatsapp}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Contact Method</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.preferred_contact_method}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td><td style="padding: 8px; border: 1px solid #ddd;">$${record.total_usd}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Reference</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${record.paystack_reference}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Registered At</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(record.created_at).toLocaleString()}</td></tr>
      </table>
    `;

    // ── Email 2: Parent confirmation ──
    const parentEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">

        <div style="background: #142033; padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
          <p style="color: #f47c20; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; margin: 0 0 8px;">PUMaC Africa · Learning Sprouts</p>
          <h1 style="color: #ffffff; font-size: 1.6rem; font-weight: 900; margin: 0; letter-spacing: -0.03em;">You're registered! 🎉</h1>
        </div>

        <div style="padding: 36px 40px; background: #fff8ef;">

          <p style="color: #142033; font-size: 1rem; line-height: 1.7; margin: 0 0 20px;">
            Dear <strong>${record.parent_name}</strong>,
          </p>

          <p style="color: #5c6678; font-size: 1rem; line-height: 1.7; margin: 0 0 28px;">
            Thank you for registering for <strong>PUMaC Africa</strong>. Your payment has been received and ${record.student_name}'s spot is confirmed. We look forward to an incredible mathematics journey!
          </p>

          <div style="background: #ffffff; border-radius: 14px; border: 1px solid rgba(20,32,51,0.08); overflow: hidden; margin-bottom: 28px;">
            <div style="background: #f47c20; padding: 12px 20px;">
              <p style="color: #ffffff; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Registration Details</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033; width: 40%;">Student Name</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;">${record.student_name}</td></tr>
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033;">Student Age</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;">${record.student_age}</td></tr>
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033;">School</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;">${record.current_school}</td></tr>
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033;">Country</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;">${record.country}</td></tr>
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033;">Program</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;">${programLabel}</td></tr>
              <tr><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: #142033;">Amount Paid</td><td style="padding: 10px 20px; border-bottom: 1px solid #f0f0f0; color: #5c6678;"><strong style="color: #142033;">$${record.total_usd}</strong></td></tr>
              <tr><td style="padding: 10px 20px; font-weight: 700; color: #142033;">Payment Reference</td><td style="padding: 10px 20px; color: #5c6678; font-family: monospace; font-size: 0.85rem;">${record.paystack_reference}</td></tr>
            </table>
          </div>

          <div style="background: #ffffff; border-radius: 14px; border: 1px solid rgba(20,32,51,0.08); padding: 24px; text-align: center; margin-bottom: 28px;">
            <p style="color: #142033; font-weight: 800; font-size: 0.95rem; margin: 0 0 8px;">Have any questions?</p>
            <p style="color: #5c6678; font-size: 0.88rem; line-height: 1.6; margin: 0 0 16px;">Feel free to reach out to us on WhatsApp — we're happy to help!</p>
            <a href="https://wa.me/254719218992" style="display: inline-block; background: #25D366; color: #ffffff; font-weight: 800; font-size: 0.9rem; padding: 12px 24px; border-radius: 999px; text-decoration: none;">
              📱 WhatsApp Us: +254 719 218 992
            </a>
            <p style="color: #8a94a6; font-size: 0.82rem; margin: 12px 0 0;">Or email us at <a href="mailto:ask@learningsprouts.school" style="color: #f47c20; text-decoration: none;">ask@learningsprouts.school</a></p>
          </div>

          <p style="color: #5c6678; font-size: 0.9rem; line-height: 1.7; margin: 0; text-align: center;">
            We can't wait to see ${record.student_name} compete! 🏆
          </p>

        </div>

        <div style="background: #142033; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
          <p style="color: rgba(255,255,255,0.5); font-size: 0.78rem; margin: 0;">© ${new Date().getFullYear()} Learning Sprouts. All rights reserved.</p>
        </div>

      </div>
    `;

    const [teamRes, parentRes] = await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "PUMaC Africa <notifications@learningsprouts.school>",
          to: ["ask@learningsprouts.school"],
          subject: `New PUMaC Registration: ${record.student_name} — $${record.total_usd}`,
          html: teamEmailBody,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "PUMaC Africa <notifications@learningsprouts.school>",
          to: [record.parent_email],
          subject: `You're registered! — PUMaC Africa by Learning Sprouts`,
          html: parentEmailBody,
        }),
      }),
    ]);

    const teamData = await teamRes.json();
    const parentData = await parentRes.json();
    console.log("Team email:", JSON.stringify(teamData));
    console.log("Parent email:", JSON.stringify(parentData));

    return new Response(JSON.stringify({ teamData, parentData }), { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
