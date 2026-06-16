import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

type Vehicle = {
  manufacturer: string;
  model: string;
  license_plate: string;
  current_mileage: number;
};

type Reminder = {
  id: string;
  user_id: string;
  title: string;
  reminder_type: string;
  due_date: string | null;
  due_mileage: number | null;
  notes: string | null;
  vehicles: Vehicle | null;
};

type UserDigest = {
  email: string;
  reminders: Reminder[];
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const emailFrom = Deno.env.get("REMINDER_EMAIL_FROM") || "";
const cronSecret = Deno.env.get("REMINDER_CRON_SECRET") || "";
const lookaheadDays = Number(Deno.env.get("REMINDER_LOOKAHEAD_DAYS") || "7");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function vehicleName(reminder: Reminder) {
  const vehicle = reminder.vehicles;
  if (!vehicle) return "Vehicle";
  return `${vehicle.manufacturer} ${vehicle.model} (${vehicle.license_plate})`;
}

function reminderReason(reminder: Reminder, today: string) {
  const parts: string[] = [];

  if (reminder.due_date) {
    parts.push(reminder.due_date < today ? `Overdue since ${reminder.due_date}` : `Due on ${reminder.due_date}`);
  }

  const vehicleMileage = reminder.vehicles?.current_mileage;
  if (reminder.due_mileage && typeof vehicleMileage === "number") {
    parts.push(vehicleMileage >= reminder.due_mileage
      ? `Mileage due now (${vehicleMileage.toLocaleString()} / ${reminder.due_mileage.toLocaleString()})`
      : `Due at ${reminder.due_mileage.toLocaleString()} miles`);
  }

  return parts.join(" | ") || "Maintenance reminder";
}

function isReminderDue(reminder: Reminder, today: string, cutoff: string) {
  const dateDue = Boolean(reminder.due_date && reminder.due_date <= cutoff);
  const mileageDue = Boolean(
    reminder.due_mileage &&
      typeof reminder.vehicles?.current_mileage === "number" &&
      reminder.vehicles.current_mileage >= reminder.due_mileage
  );

  return dateDue || mileageDue;
}

function buildEmail(email: string, reminders: Reminder[], today: string) {
  const rows = reminders
    .map((reminder) => {
      const title = escapeHtml(reminder.title);
      const vehicle = escapeHtml(vehicleName(reminder));
      const reason = escapeHtml(reminderReason(reminder, today));
      const notes = reminder.notes ? `<p style="margin:6px 0 0;color:#4b5563">${escapeHtml(reminder.notes)}</p>` : "";

      return `
        <li style="margin:0 0 16px;padding:14px;border:1px solid #e5e7eb;border-radius:8px">
          <strong style="display:block;color:#111827">${title}</strong>
          <span style="display:block;color:#374151">${vehicle}</span>
          <span style="display:block;color:#b45309">${reason}</span>
          ${notes}
        </li>`;
    })
    .join("");

  const text = [
    "Your AutoCare maintenance reminders",
    "",
    ...reminders.map((reminder) => [
      `- ${reminder.title}`,
      `  ${vehicleName(reminder)}`,
      `  ${reminderReason(reminder, today)}`,
      reminder.notes ? `  Notes: ${reminder.notes}` : "",
    ].filter(Boolean).join("\n")),
    "",
    "Open AutoCare Tracker to update or complete these reminders.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:640px;margin:0 auto">
      <h1 style="font-size:22px;margin:0 0 12px">Your AutoCare maintenance reminders</h1>
      <p style="margin:0 0 20px;color:#374151">Hi ${escapeHtml(email)}, these reminders are due soon or overdue.</p>
      <ul style="list-style:none;padding:0;margin:0">${rows}</ul>
      <p style="margin:20px 0 0;color:#374151">Open AutoCare Tracker to update or complete these reminders.</p>
    </div>`;

  return { text, html };
}

async function sendEmail(to: string, reminders: Reminder[], today: string) {
  const { text, html } = buildEmail(to, reminders, today);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject: reminders.length === 1
        ? `AutoCare reminder: ${reminders[0].title}`
        : `AutoCare: ${reminders.length} maintenance reminders`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with ${response.status}: ${await response.text()}`);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom || !cronSecret) {
    return json({ error: "Missing required Supabase, Resend, sender, or cron secret environment variables" }, 500);
  }

  if (request.headers.get("x-cron-secret") !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const today = isoDate(new Date());
  const cutoff = isoDate(addDays(new Date(), Number.isFinite(lookaheadDays) ? lookaheadDays : 7));

  const { data, error } = await supabase
    .from("reminders")
    .select(`
      id,
      user_id,
      title,
      reminder_type,
      due_date,
      due_mileage,
      notes,
      vehicles (
        manufacturer,
        model,
        license_plate,
        current_mileage
      )
    `)
    .eq("is_completed", false)
    .is("reminder_email_sent_at", null)
    .or(`due_date.lte.${cutoff},due_mileage.not.is.null`)
    .limit(500);

  if (error) {
    return json({ error: error.message }, 500);
  }

  const dueReminders = ((data || []) as Reminder[]).filter((reminder) => isReminderDue(reminder, today, cutoff));
  const digests = new Map<string, UserDigest>();

  for (const reminder of dueReminders) {
    const existing = digests.get(reminder.user_id);
    if (existing) {
      existing.reminders.push(reminder);
      continue;
    }

    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reminder.user_id);
    const email = userData.user?.email;

    if (userError || !email) {
      await supabase
        .from("reminders")
        .update({ reminder_email_last_status: userError?.message || "User has no email" })
        .eq("id", reminder.id);
      continue;
    }

    digests.set(reminder.user_id, { email, reminders: [reminder] });
  }

  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const digest of digests.values()) {
    try {
      await sendEmail(digest.email, digest.reminders, today);
      sent += digest.reminders.length;

      await supabase
        .from("reminders")
        .update({
          reminder_email_sent_at: new Date().toISOString(),
          reminder_email_last_status: "sent",
        })
        .in("id", digest.reminders.map((reminder) => reminder.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email error";
      failures.push({ email: digest.email, error: message });

      await supabase
        .from("reminders")
        .update({ reminder_email_last_status: message.slice(0, 500) })
        .in("id", digest.reminders.map((reminder) => reminder.id));
    }
  }

  return json({
    checked: dueReminders.length,
    digests: digests.size,
    sent,
    failures,
  });
});
