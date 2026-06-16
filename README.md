
  # Start Design Implementation

  This is a code bundle for Start Design Implementation. The original project is available at https://www.figma.com/design/bBBWhQprdNeInj4vZE4I8f/Start-Design-Implementation.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Reminder Emails

  Reminder emails are handled by the Supabase Edge Function at `supabase/functions/send-reminder-emails`.

  Required Supabase secrets:

  - `RESEND_API_KEY`
  - `REMINDER_EMAIL_FROM`, for example `AutoCare <reminders@yourdomain.com>`
  - `REMINDER_CRON_SECRET`, any long random string
  - `REMINDER_LOOKAHEAD_DAYS`, optional, defaults to `7`

  The function checks incomplete reminders that are due within the lookahead window or due by mileage, sends one digest email per user through Resend, and writes `reminder_email_sent_at` so the same reminder is not emailed repeatedly.

  Deploy steps:

  ```bash
  supabase db push
  supabase secrets set RESEND_API_KEY=your_resend_key
  supabase secrets set "REMINDER_EMAIL_FROM=AutoCare <reminders@yourdomain.com>"
  supabase secrets set REMINDER_CRON_SECRET=your_long_random_secret
  supabase functions deploy send-reminder-emails
  ```

  Schedule the function in Supabase to run daily with a `POST` request and this header:

  ```text
  x-cron-secret: your_long_random_secret
  ```
  
