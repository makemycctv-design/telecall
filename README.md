# TeleCRM — Telecalling CRM (PWA)

A production-oriented **Telecalling CRM** built with **Laravel 13 + Inertia.js + React + Tailwind CSS**, packaged as an installable **Progressive Web App** with offline support, background sync and web push.

Roles: **Admin**, **Manager**, **Telecaller**. Modules: Lead Management, Call Logging, Daily Tasks & Timers, Progress Analytics, and categorised Reporting (Ongoing / Completed / Pending).

---

## 1. System Architecture Overview

```
                    ┌───────────────────────────────────────────────┐
   Browser / PWA    │  React (Inertia pages)  •  Tailwind  •  Vite   │
   (installable)    │  Service Worker: precache / SWR / bg-sync/push │
                    └───────────────┬───────────────────────────────┘
                                    │  Inertia XHR (JSON page props)
                                    ▼
     ┌──────────────────────────────────────────────────────────────┐
     │                       Laravel (HTTP layer)                     │
     │  Routes (role groups) → FormRequests → Controllers             │
     │        │                                   │                   │
     │        ▼                                   ▼                   │
     │   Policies (RBAC)                     Services (domain logic)  │
     │                                   Assignment / Status / Call / │
     │                                   Metrics / Report / Import    │
     │        │                                   │                   │
     │        ▼                                   ▼                   │
     │   Eloquent Models  ◄──────────────►  Queued Jobs + Notifications│
     └───────────────┬──────────────────────────┬────────────────────┘
                     ▼                           ▼
                MySQL (OLTP)              Queue (DB/Redis) + Scheduler
```

**Key decisions**

- **Inertia** removes the need for a separate REST/GraphQL API while keeping a real React SPA. Controllers return `Inertia::render()`.
- **Domain logic lives in Services**, not controllers, so it is reusable by controllers, jobs and console commands.
- **Statuses are PHP enums** cast on models — type-safe, self-describing (label/color/options) and DB-portable.
- **Pre-aggregated metrics** (`daily_staff_metrics`) keep dashboards fast; heavy reports can be materialised into `report_snapshots` by queued jobs.
- **PWA** uses `vite-plugin-pwa` (injectManifest) with a hand-rolled service worker for precise control over offline caching, IndexedDB background-sync and push.

---

## 2. Database Schema

All status-like columns are stored as short strings and cast to PHP enums. `softDeletes` on `users`, `leads`, `tasks`.

| Table | Key columns | Notes / Indexes |
|---|---|---|
| `users` | name, email✦, phone, password, **manager_id→users**, is_active, last_active_at, deleted_at | self-referencing manager; `is_active`, `phone` indexed |
| `roles` | slug✦, name, description | admin / manager / telecaller |
| `role_user` | user_id→, role_id→ | unique(user_id, role_id) |
| `lead_sources` | name, slug✦, is_active | |
| `lead_tags` | name, slug✦, color | Tailwind colour token |
| `leads` | name, company, email, phone, alt_phone, city, **status**, **priority**, lead_source_id→, **assigned_to→users**, created_by→, deal_value, notes, last_contacted_at, next_follow_up_at, converted_at, deleted_at | idx: (assigned_to,status), (status,next_follow_up_at), (assigned_to,next_follow_up_at) |
| `lead_tag_map` | lead_id→, lead_tag_id→ | unique pair |
| `lead_assignments` | lead_id→, assigned_to→, assigned_by→, strategy, reason, assigned_at, unassigned_at | full assignment audit trail |
| `lead_status_histories` | lead_id→, changed_by→, from_status, to_status, note | idx (lead_id, created_at) |
| `tasks` | lead_id→, **assigned_to→**, created_by→, title, description, **type**, **status**, due_at, started_at, completed_at, time_spent_seconds, call_log_id, deleted_at | idx (assigned_to,status,due_at) |
| `call_logs` | lead_id→, user_id→, task_id→, **outcome**, started_at, ended_at, duration_seconds, notes, next_follow_up_at, **client_uuid✦** | client_uuid = offline dedup; idx (user_id,created_at),(lead_id,created_at) |
| `app_notifications` | user_id→, **type**, title, body, action_url, data(json), read_at | idx (user_id, read_at) |
| `push_subscriptions` | user_id→, endpoint, **endpoint_hash✦**, public_key, auth_token, content_encoding, user_agent, last_used_at | sha256 hash makes endpoint uniquely indexable on MySQL |
| `daily_staff_metrics` | user_id→, metric_date, calls_made, calls_connected, talk_time_seconds, follow_ups_completed, tasks_completed, tasks_overdue, leads_interested, leads_converted, task_time_seconds | unique(user_id, metric_date) |
| `report_snapshots` | type, period, period_start, period_end, generated_by→, filters(json), payload(json), generated_at | materialised async reports |

✦ = unique · → = foreign key

**Enums** (`app/Enums`): `RoleType`, `LeadStatus` (new, in_progress, interested, not_interested, callback, converted), `LeadPriority` (low/medium/high), `CallOutcome` (connected, no_answer, busy, wrong_number, interested, not_interested, callback_requested, converted), `TaskType`, `TaskStatus`, `NotificationType`.

> **MySQL vs SQLite:** the schema runs on both. For local sandboxing `DB_CONNECTION=sqlite` works out of the box; production targets MySQL (`.env.example`). Enum columns may be promoted to native `ENUM` on MySQL for storage savings if desired.

---

## 3. Models & Relationships

- **User** `belongsToMany Role`, `hasMany assignedLeads/tasks/callLogs/appNotifications/pushSubscriptions/dailyMetrics`, self `manager()/teamMembers()`. Helpers: `hasRole/hasAnyRole/primaryRole/isAdmin/isManager/isTelecaller`; scopes `telecallers()`, `active()`.
- **Lead** `belongsTo source/assignee/creator`, `belongsToMany tags`, `hasMany callLogs/tasks/assignments/statusHistories`. Scopes: `forUser` (role visibility), `open`, `overdueFollowUp`, `status`.
- **Task** `belongsTo lead/assignee/creator`. Scopes: `forUser`, `open`, `overdue`, `dueToday`.
- **CallLog** `belongsTo lead/user/task`; enum-cast `outcome`; scope `connected`, `forDate`.
- **LeadAssignment / LeadStatusHistory / LeadSource / LeadTag / AppNotification / PushSubscription / DailyStaffMetric / ReportSnapshot** — as per schema.

`Lead::forUser($user)` centralises row-level visibility: **admin** → all; **manager** → their team (+self); **telecaller** → own only.

---

## 4. Routes (`routes/web.php`)

```
guest:      /  →login   GET/POST login
public PWA: GET /sw.js   GET /manifest.webmanifest
auth (all roles):
  GET  dashboard
  GET  leads · POST leads · GET leads/{lead} · PATCH leads/{lead} · DELETE leads/{lead}
  PATCH leads/{lead}/status
  GET  tasks · POST tasks · PATCH tasks/{task}
  POST tasks/{task}/start|stop|complete · DELETE tasks/{task}
  POST call-logs
  GET  notifications · POST notifications/{n}/read · POST notifications/read-all
  POST/DELETE push-subscriptions
auth + role:manager,admin:
  PATCH leads/{lead}/assign
  GET/POST import · GET import/template
  GET reports · GET reports/export · GET performance
auth + role:admin:
  GET/POST staff · PATCH/DELETE staff/{user}
```

`role` is a middleware alias (`EnsureUserHasRole`) used as `role:manager,admin`. Writes are additionally guarded by **Policies**.

---

## 5. Controller Structure

Thin controllers delegating to services; every page uses `Inertia::render()`.

- `Auth\AuthenticatedSessionController` — login/logout.
- `DashboardController` — dispatches to `Dashboard/{Admin,Manager,Telecaller}` with role-specific KPIs, pipeline, leaderboard.
- `LeadController` — filtered/paginated index (eager-loaded), detail + activity timeline, CRUD, `updateStatus`, `assign`.
- `TaskController` — tabbed planner (today/overdue/upcoming/completed) + timer `start/stop/complete`.
- `CallLogController` — `store` (delegates to `CallLogService`).
- `ReportController` — `index` (ongoing/completed/pending) + streamed CSV `export`.
- `LeadImportController` — sync import (≤200 rows) else queue `ImportLeadsJob`; CSV `template`.
- `NotificationController`, `PushSubscriptionController`, `StaffController`, `PerformanceController`.

---

## 6. Inertia Page Flow

```
Login ──► Dashboard (role-based)
             ├─ Leads/Index ─► Leads/Show ─► (Log call / change status / assign)
             │                     └─ Activity timeline (calls+status+assignments)
             ├─ Tasks/Index (timer + complete)
             ├─ Reports/Index (Ongoing|Completed|Pending, filters, chart, export)
             ├─ Reports/Performance (KPIs, trend, per-staff table)
             ├─ Leads/Import (CSV upload, template)
             ├─ Notifications/Index (mark read, enable push)
             └─ Staff/Index (admin CRUD)
```

Shared props (`HandleInertiaRequests`): `auth.user{roles, primary_role}`, `flash.{success,error}`, `unread_notifications_count`, `ziggy`.

---

## 7. React Component Structure

```
resources/js/
  app.jsx                     Inertia bootstrap + SW registration + theme
  theme.js                    dark-mode controller (localStorage + OS)
  pwa.js                      SW register, install prompt, push subscribe
  sw.js                       service worker (precache/SWR/bg-sync/push)
  lib/{format,badge}.js       formatting + Tailwind badge maps
  Components/
    ui.jsx                    Button, Card, Badge, StatusBadge, Field, Input,
                              Select, Textarea, Spinner, EmptyState, KpiCard,
                              Avatar, Pagination, Modal
    ThemeToggle · OfflineBanner · InstallPrompt · PipelineBar · CallLogForm
  Layouts/
    AuthenticatedLayout.jsx   sidebar + topbar + mobile bottom nav (role-aware)
    GuestLayout.jsx
  Pages/
    Auth/Login · Dashboard/{Admin,Manager,Telecaller}
    Leads/{Index,Show,Import} · Tasks/Index
    Reports/{Index,Performance} · Notifications/Index · Staff/Index
```

UI: compact CRM styling, colour-coded status/priority badges, responsive (mobile bottom-nav ↔ desktop sidebar), empty/loading/error states, dark mode.

---

## 8. PWA Setup

- **Manifest** (`vite.config.js` → `public/build/manifest.webmanifest`): name, icons (192/512 + maskable), `display: standalone`, `start_url: /dashboard`, theme colour. Served from root via a Laravel route and linked in `app.blade.php`.
- **Service worker** (`resources/js/sw.js`, built to `public/build/sw.js`, served at `/sw.js` with `Service-Worker-Allowed: /`):
  - **Precache** app shell + build assets (injected `self.__WB_MANIFEST`) + `offline.html`.
  - **Runtime caching:** navigations → *network-first* (offline fallback); GET API/JSON (recently viewed leads/tasks) → *stale-while-revalidate*; static assets → *cache-first*.
  - **Background sync:** failed `POST /call-logs` (and lead notes) are stored in **IndexedDB** and replayed on the `sync` event / next launch. Requests carry a `client_uuid` so the server dedupes replays.
  - **Push:** `push` shows a notification; `notificationclick` focuses/opens the target URL.
- **Install prompt:** `beforeinstallprompt` captured and surfaced via a custom `InstallPrompt` component (dismissal remembered).
- **Offline UI:** `OfflineBanner` reacts to online/offline + SW "update available".
- **Push subscription:** `subscribeToPush()` requests permission, subscribes with the VAPID public key and `POST`s to `/push-subscriptions`. Server delivery via `SendWebPushJob` (uses `minishlink/web-push` when installed; otherwise logs — no hard dependency).

Generate VAPID keys: `composer require minishlink/web-push` then `php artisan telecrm:vapid` → paste into `.env`.

---

## 9. Suggested Folder Structure

```
app/
  Console/Commands/GenerateVapidKeys.php
  Enums/                         7 enums
  Http/Controllers/ · Middleware/(HandleInertiaRequests, EnsureUserHasRole) · Requests/
  Jobs/                          Import, AggregateDailyMetrics, ScanFollowUps,
                                 GenerateReportSnapshot, SendWebPush
  Models/                        12 models
  Notifications/ + Channels/     App(DB) + WebPush channels
  Policies/                      Lead, Task, CallLog
  Services/                      Assignment, Status, CallLog, Metrics, Report, Import
config/telecrm.php               strategy, aging, VAPID, outcome→status map
database/{migrations,factories,seeders}
resources/js/                    (see §7)
routes/{web.php, console.php}    console.php = scheduler
```

---

## 10. Sample Code Snippets

**Migration (leads, excerpt)** — `database/migrations/..._create_leads_table.php`
```php
$table->string('status', 30)->default(LeadStatus::New->value)->index();
$table->string('priority', 10)->default(LeadPriority::Medium->value)->index();
$table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
$table->timestamp('next_follow_up_at')->nullable()->index();
$table->index(['assigned_to', 'status']);
$table->index(['status', 'next_follow_up_at']);
```

**Route grouping**
```php
Route::middleware('auth')->group(function () {
    Route::get('leads', [LeadController::class, 'index'])->name('leads.index');
    Route::middleware('role:manager,admin')->group(function () {
        Route::patch('leads/{lead}/assign', [LeadController::class, 'assign'])->name('leads.assign');
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    });
    Route::middleware('role:admin')->group(function () {
        Route::post('staff', [StaffController::class, 'store'])->name('staff.store');
    });
});
```

**Lead controller (index, excerpt)**
```php
$leads = Lead::query()->forUser($request->user())
    ->with(['assignee:id,name', 'source:id,name', 'tags:id,name,color'])
    ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($w) => $w
        ->where('name', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")))
    ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
    ->orderByDesc('updated_at')->paginate(15)->withQueryString();

return Inertia::render('Leads/Index', compact('leads') + ['options' => $this->filterOptions($request->user())]);
```

**Task controller (timer complete)**
```php
public function complete(Request $r, Task $task) {
    $this->authorize('update', $task);
    if ($task->started_at) $task->time_spent_seconds += (int) now()->diffInSeconds($task->started_at, true);
    $task->forceFill(['status' => TaskStatus::Completed->value, 'completed_at' => now(), 'started_at' => null])->save();
    return back()->with('success', 'Task completed.');
}
```

**Report controller (categorised)**
```php
$report = $this->reports->build($request->string('category', 'ongoing'),
                                $request->user(), $request->only([...]));
return Inertia::render('Reports/Index', compact('report'));
```

**React dashboard page (excerpt)** — `Pages/Dashboard/Telecaller.jsx`
```jsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  <KpiCard label="My open leads" value={kpis.my_leads} />
  <KpiCard label="Talk time" value={formatDuration(kpis.talk_time)} />
  <KpiCard label="Overdue" value={kpis.overdue} tone={kpis.overdue ? 'bad' : 'default'} />
</div>
<PipelineBar pipeline={pipeline} />
```

**Service worker registration** — `resources/js/pwa.js`
```js
const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstallPrompt = e; });
```

---

## 11. Deployment Notes

1. **Server:** PHP 8.3+, Node 20+, MySQL 8, a queue worker and cron.
2. **Install:** `composer install --no-dev -o` · `npm ci && npm run build`.
3. **Env:** set `APP_ENV=production`, `APP_KEY` (`php artisan key:generate`), MySQL `DB_*`, `QUEUE_CONNECTION=redis|database`, VAPID keys.
4. **Migrate:** `php artisan migrate --force` (optionally `--seed` for demo data).
5. **Cache:** `php artisan config:cache route:cache view:cache`.
6. **Queue worker:** `php artisan queue:work --tries=3` (systemd/supervisor). Powers imports, metric aggregation, notifications, push.
7. **Scheduler cron:** `* * * * * php /path/artisan schedule:run >> /dev/null 2>&1` → runs `ScanFollowUpsJob` (15 min) + `AggregateDailyMetricsJob`.
8. **HTTPS is required** for service workers, install and push.
9. **Web push:** `composer require minishlink/web-push`, `php artisan telecrm:vapid`, add keys to `.env`.

---

## Additional Reference

**KPI definitions & formulas**

| KPI | Formula |
|---|---|
| Conversion rate | converted ÷ total leads × 100 |
| Connect rate | calls_connected ÷ calls_made × 100 |
| Talk time | Σ `call_logs.duration_seconds` |
| Follow-ups completed | completed tasks of type follow_up/callback |
| Lead aging | now − `leads.created_at` (config `lead_aging_hours`, default 72h) |
| Overdue task | open task with `due_at < now` |

**Report categories**

- **Ongoing** — open pipeline (new, in_progress, interested, callback).
- **Completed** — converted leads + completed tasks (+ deal value).
- **Pending** — overdue follow-ups, overdue tasks, unassigned leads.

**Recommended indexes** — shipped on `leads(assigned_to,status)`, `leads(status,next_follow_up_at)`, `tasks(assigned_to,status,due_at)`, `call_logs(user_id,created_at)`, `daily_staff_metrics(user_id,metric_date)`.

**Queue usage** — CSV import (>200 rows), metric aggregation, report snapshots, and every web-push send are queued to keep requests fast.

**Offline sync strategy** — mutations are attempted online first; on failure the SW enqueues them in IndexedDB and replays via Background Sync. Server-side idempotency uses `call_logs.client_uuid` so replays never duplicate.

---

## Demo accounts (after `php artisan migrate:fresh --seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@telecrm.test | password |
| Manager | manager@telecrm.test | password |
| Telecaller | telecaller@telecrm.test | password |

## Local quick start

```bash
composer install
npm install
cp .env.example .env && php artisan key:generate
# sqlite: touch database/database.sqlite  (or configure MySQL DB_* in .env)
php artisan migrate:fresh --seed
npm run build      # or: npm run dev
php artisan serve
```
