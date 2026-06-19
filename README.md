# AutoCare — Vehicle Maintenance Management System

AutoCare is a responsive web application that helps vehicle owners keep their maintenance information in one place. Users can register vehicles, record completed services and costs, attach receipts, schedule date- or mileage-based reminders, review upcoming and overdue work, and analyse expenses.

> Bachelor project, Caucasus University — Caucasus School of Technology<br>
> Student: `[Name and surname]` · Supervisor: `[Name and surname]` · Academic year: `2025–2026`

## Project overview

Vehicle maintenance information is often scattered between paper receipts, calendar entries, repair-shop messages, and memory. This makes it easy to miss a service interval, lose a vehicle's history, or underestimate ownership costs. AutoCare addresses this problem with a single, user-specific maintenance workspace available from desktop and mobile browsers.

The project demonstrates the design and implementation of a full-stack single-page application, including authentication, relational data modelling, file storage, row-level access control, third-party API integration, responsive data visualisation, and scheduled serverless email processing.

## Objectives and expected results

- Provide secure account registration, email confirmation, sign-in, password recovery, and profile management.
- Let each user create, edit, view, and delete vehicles and upload a vehicle photo.
- Maintain a searchable service history with mileage, service provider, notes, cost, and receipt attachments.
- Support reminders based on a due date, target mileage, or both, and clearly classify upcoming and overdue maintenance.
- Present monthly and category-based expense statistics and allow expense data to be exported as CSV.
- Notify users inside the application and send reminder digest emails through a scheduled backend function.
- Keep every user's records isolated through database and storage access policies.
- Deliver a responsive production build that can be deployed as a static SPA with Supabase as its backend.

## Main features

- **Authentication:** registration, email verification, persistent or session-only login, password recovery, password update, and global sign-out.
- **Vehicle management:** vehicle details, current mileage, registration data, make/model lookup, and vehicle photos.
- **Service records:** full CRUD workflow, service notes, provider, mileage, cost, and private receipt uploads.
- **Maintenance planning:** date- and mileage-based reminders, upcoming/overdue queues, and completion tracking.
- **Expense analytics:** totals, averages, service categories, monthly trends, vehicle/date filters, and CSV export.
- **Notifications:** generated activity and reminder notifications with read/unread state.
- **Account settings:** display name, email, avatar, and security settings.
- **Responsive interface:** layouts and navigation designed for both desktop and mobile use.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 6 |
| Styling and UI | Tailwind CSS 4, Material UI, Radix UI, Lucide React |
| Charts and interaction | Recharts, Motion, React Hook Form |
| Backend | Supabase Auth, PostgreSQL, Storage, Edge Functions |
| Email delivery | Resend |
| External data | NHTSA vPIC API for vehicle manufacturers and models |
| Deployment | Vercel or Netlify |

## System architecture

```text
Browser (React + TypeScript SPA)
   ├── Supabase Auth ───────────── user sessions and account recovery
   ├── Supabase PostgreSQL ─────── profiles, vehicles, services, reminders, notifications
   ├── Supabase Storage ────────── avatars, vehicle photos, private receipts
   ├── NHTSA vPIC API ──────────── vehicle make/model catalogue
   └── Supabase Edge Function
          └── Resend API ───────── scheduled reminder digest emails
```

The frontend is organised into pages, reusable components, domain services, utility functions, and generated database types. Service modules form the data-access layer between React and Supabase. The application is an SPA and uses History API routes; deployment configuration redirects unknown paths to `index.html`.

### Data model

| Entity | Purpose | Main relationship |
| --- | --- | --- |
| `profiles` | User display name and avatar | One row per authenticated user |
| `vehicles` | Vehicle identity, mileage, and photo | Belongs to a user |
| `service_records` | Completed maintenance and expenses | Belongs to a user and vehicle |
| `reminders` | Date/mileage maintenance targets | Belongs to a user and vehicle |
| `notifications` | Persisted application events | Belongs to a user |

All application tables use PostgreSQL Row Level Security. Authenticated users can select and modify only rows whose `user_id` matches their Supabase identity. Storage policies likewise restrict writes to the user's own folder. Receipt files are private and accessed through short-lived signed URLs; avatar and vehicle-photo buckets are publicly readable.

## Repository structure

```text
AutoCare/
├── src/
│   ├── app/
│   │   ├── components/       reusable application and UI components
│   │   ├── pages/            route-level screens
│   │   ├── services/         authentication and Supabase data operations
│   │   ├── types/            database types
│   │   └── utils/            reminders, expenses, and UI helpers
│   ├── styles/               global styles and Tailwind theme
│   └── main.tsx              application entry point
├── supabase/
│   ├── functions/            reminder-email Edge Function
│   ├── migrations/           incremental database changes
│   ├── schema.sql            complete database/storage setup
│   └── config.toml           local Supabase configuration
├── public/                    static assets
├── netlify.toml              Netlify build and SPA redirect rules
├── vercel.json               Vercel build and SPA rewrite rules
└── package.json              scripts and dependencies
```

## Local installation

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project
- Supabase CLI, if applying migrations or deploying the Edge Function from the terminal
- A Resend account, only if reminder emails are required

### 1. Install dependencies

```bash
git clone <repository-url>
cd AutoCare
npm install
```

### 2. Configure Supabase

Create a Supabase project, open its SQL Editor, and run [`supabase/schema.sql`](supabase/schema.sql). The script creates the tables, triggers, indexes, storage buckets, and access policies required by the application.

For an existing project, apply only outstanding migrations instead:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

In Supabase Authentication, configure the application URL and permitted redirect URLs for local development and production. Email confirmation must be enabled if verified registration is required.

### 3. Add environment variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-or-anon-key>
```

Only use the public publishable/anonymous key in the frontend. Never expose the Supabase service-role key or a Resend API key through a `VITE_` variable.

### 4. Start the application

```bash
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. Create an account, confirm the email if required, and add a first vehicle to begin.

## User guide

1. **Create an account:** register with a name, email address, and password; complete email verification if enabled.
2. **Add a vehicle:** enter its identifying details and current mileage. The NHTSA integration supplies manufacturer and model options, while manual values remain available when needed.
3. **Record maintenance:** open Service History, add the work performed, date, mileage, provider, cost, notes, and an optional receipt.
4. **Plan future work:** create a reminder with a target date, target mileage, or both. AutoCare places it in the upcoming or overdue queue according to its current state.
5. **Review spending:** use Expense Analytics to filter by vehicle and time period, inspect charts and category totals, or export the selected records to CSV.
6. **Manage alerts:** review generated notifications, mark them as read, and complete maintenance reminders after service is performed.
7. **Update the account:** use Settings to change profile details, avatar, email, password, or active sessions.

## Reminder email automation

Reminder emails are generated by `supabase/functions/send-reminder-emails`. The function checks incomplete reminders due within a configurable look-ahead window or due by mileage, sends one digest per user through Resend, and stores `reminder_email_sent_at` to prevent duplicate messages.

Set the required Supabase secrets and deploy the function:

```bash
supabase secrets set RESEND_API_KEY=<resend-api-key>
supabase secrets set "REMINDER_EMAIL_FROM=AutoCare <reminders@yourdomain.com>"
supabase secrets set REMINDER_CRON_SECRET=<long-random-secret>
supabase secrets set REMINDER_LOOKAHEAD_DAYS=7
supabase functions deploy send-reminder-emails
```

Schedule a daily `POST` request to the deployed function and include this header:

```text
x-cron-secret: <the-same-long-random-secret>
```

`REMINDER_LOOKAHEAD_DAYS` is optional and defaults to `7`. The sending domain/address must be verified in Resend.

## Build and deployment

Create and locally verify the production bundle:

```bash
npm run build
npx vite preview
```

The generated files are written to `dist/`. Both Vercel and Netlify configurations are included. Add the two `VITE_SUPABASE_*` environment variables to the selected hosting provider, deploy the repository, then add the final domain to Supabase's allowed redirect URLs.

## Testing and verification

The repository currently has no automated test suite. Before a release, verify at minimum:

- registration, verification, login, logout, and password recovery;
- isolation of records between two different user accounts;
- vehicle, service-record, reminder, and notification CRUD operations;
- avatar, vehicle-photo, and receipt upload/access rules;
- date- and mileage-based reminder classification;
- expense calculations, filtering, charts, and CSV export;
- email-function authentication, delivery, and duplicate prevention;
- responsive layouts and direct URL loading on desktop and mobile browsers;
- a clean `npm run build` result.

Automated unit, integration, and end-to-end tests are a recommended next step.

## Scope and limitations

AutoCare focuses on personal vehicle-maintenance tracking. It is not a repair-shop management, parts inventory, payment, telematics, or diagnostic system. Vehicle make/model lookup depends on the availability and coverage of the external NHTSA API. Mileage is entered manually, so mileage-triggered reminders reflect the last stored odometer value. Email delivery depends on Supabase scheduling and Resend configuration. Internet access is required for authentication, persistence, uploads, and external vehicle data.

## Future development

- Add automated unit, integration, accessibility, and end-to-end tests.
- Add service-interval templates based on vehicle and manufacturer guidance.
- Support multiple currencies and locale-aware date/number formatting.
- Add offline/PWA support and push notifications.
- Add maintenance reports in PDF format and richer data import/export.
- Improve accessibility auditing, monitoring, and operational logging.

## Privacy, security, and academic integrity

AutoCare stores personal account and vehicle-maintenance data. Database Row Level Security and storage ownership policies are central security controls, but a production deployment should also maintain secure redirect settings, secret rotation, dependency updates, backups, retention rules, and a user-facing privacy policy. Collect only data needed for the service and handle deletion/export requests in accordance with applicable data-protection requirements, including GDPR where relevant.

Third-party packages and design resources are documented in [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md). Contributions and submitted academic work must preserve source attribution and comply with the licences of all reused material.

## License

No open-source licence has currently been declared. Unless a licence is added, the source code remains under the copyright of its author(s) and may not be reused or redistributed without permission.
