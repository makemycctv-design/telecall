# Deploying TeleCRM on cPanel (shared hosting)

Target in this guide:
- Domain: `https://telecall.nokkoo.in`
- App path: `/home/<cpanel_user>/telecall.nokkoo.in`
- MySQL DB: `<cpanel_user>_telecall`

> **Never commit real credentials.** Put them only in the server's `.env` file
> (which is git-ignored). The values below use placeholders.

Because most shared cPanel plans have **no Node.js**, the built frontend assets
in `public/build` are committed to this repo, so you do **not** need to run
`npm run build` on the server. You only need PHP 8.3+ and Composer.

---

## 1. Get the code onto the server

Using cPanel **Terminal** (or SSH):

```bash
cd ~
# If the domain folder already exists, clone into a temp dir then move contents in.
git clone https://github.com/makemycctv-design/telecall.git telecall_src
```

### Single-folder deployment (document root stays as the domain folder)

Put **all** the app files directly inside `/home/<cpanel_user>/telecall.nokkoo.in`
and leave the document root unchanged. The repo ships a root `.htaccess` that
internally forwards every request into Laravel's `public/` front controller, so
you do **not** need to switch the doc root to `/public`.

```bash
# Move everything (including dotfiles like .htaccess and .env.example) in.
shopt -s dotglob
mv ~/telecall_src/* /home/<cpanel_user>/telecall.nokkoo.in/
shopt -u dotglob
rmdir ~/telecall_src

# Confirm the forwarding .htaccess and the app are in place
cd /home/<cpanel_user>/telecall.nokkoo.in
ls -la .htaccess artisan public/index.php
```

How it works / why it's safe:
- A request to `/` or `/leads` is rewritten to `public/...` → `public/index.php`.
- A request to an app file such as `/.env`, `/app/...`, `/storage/...` is
  rewritten to `/public/.env` etc., which does not exist, so it is never served.

> If the domain folder already contains a default `index.html` from cPanel,
> delete it first (`rm -f index.html`) so it doesn't shadow the app.

---

## 2. Install PHP dependencies

```bash
cd <app-root>          # the folder that contains artisan
composer install --no-dev --optimize-autoloader
```

## 3. Configure the environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set (replace placeholders with your real values):

```
APP_NAME=TeleCRM
APP_ENV=production
APP_DEBUG=false
APP_URL=https://telecall.nokkoo.in

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=<cpanel_user>_telecall
DB_USERNAME=<cpanel_user>_telecall
DB_PASSWORD=<your-db-password>

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Optional Web Push:
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
# VITE_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
```

> In cPanel → **MySQL Databases**, make sure the DB user is created and
> **added to the database with ALL PRIVILEGES**.

## 4. Migrate and prepare storage

```bash
php artisan migrate --force
php artisan db:seed --force        # optional: demo roles/users/leads
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

## 5. Cache config for production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 6. Background work (cron)

cPanel → **Cron Jobs**. Add one entry (runs the Laravel scheduler, which drives
follow-up reminders and nightly metric aggregation):

```
* * * * * cd /home/<cpanel_user>/telecall.nokkoo.in && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
```

Queued work (imports, notifications, web push) uses the `database` queue. Add a
second cron to drain it every minute:

```
* * * * * cd /home/<cpanel_user>/telecall.nokkoo.in && /usr/local/bin/php artisan queue:work --stop-when-empty >> /dev/null 2>&1
```

> If your plan disallows long-running workers, set `QUEUE_CONNECTION=sync` in
> `.env` instead — jobs then run inline during the web request.

## 7. HTTPS

Enable AutoSSL / Let's Encrypt for `telecall.nokkoo.in` in cPanel. HTTPS is
**required** for the PWA service worker, install prompt, and web push.

---

## Updating later

```bash
cd <app-root>
git pull origin main
composer install --no-dev -o
php artisan migrate --force
php artisan config:cache route:cache view:cache
```

Because `public/build` is versioned, `git pull` also updates the frontend
assets — no Node build needed on the server.
