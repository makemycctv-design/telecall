<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CallLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadImportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectLogController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\PwaController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Guest
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| PWA assets (public, served from the site root for full SW scope)
|--------------------------------------------------------------------------
*/
Route::get('sw.js', [PwaController::class, 'serviceWorker'])->name('pwa.sw');
Route::get('manifest.webmanifest', [PwaController::class, 'manifest'])->name('pwa.manifest');

// Landing: auth users reach the dashboard; guests are bounced to login by the
// auth middleware. Route::redirect is cacheable (uses RedirectController).
Route::redirect('/', '/dashboard')->name('home');

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Authenticated (all roles)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Leads (query layer scopes visibility per role; policies enforce writes).
    Route::get('leads', [LeadController::class, 'index'])->name('leads.index');
    Route::post('leads', [LeadController::class, 'store'])->name('leads.store');
    Route::get('leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
    Route::patch('leads/{lead}', [LeadController::class, 'update'])->name('leads.update');
    Route::delete('leads/{lead}', [LeadController::class, 'destroy'])->name('leads.destroy');
    Route::patch('leads/{lead}/status', [LeadController::class, 'updateStatus'])->name('leads.status');

    // Tasks & timer.
    Route::get('tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::post('tasks/{task}/start', [TaskController::class, 'start'])->name('tasks.start');
    Route::post('tasks/{task}/stop', [TaskController::class, 'stop'])->name('tasks.stop');
    Route::post('tasks/{task}/complete', [TaskController::class, 'complete'])->name('tasks.complete');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Call logs (queued for offline background-sync on the client).
    Route::post('call-logs', [CallLogController::class, 'store'])->name('call-logs.store');

    // Notification center.
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');

    // Web Push subscription endpoints (JSON).
    Route::post('push-subscriptions', [PushSubscriptionController::class, 'store'])->name('push.store');
    Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy'])->name('push.destroy');

    /*
    |----------------------------------------------------------------------
    | Projects (Executor task list + Manager handoff). Policies enforce that
    | executors only see/act on their own projects; managers assign.
    |----------------------------------------------------------------------
    */
    Route::middleware('role:manager,admin,executor')->group(function () {
        Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::patch('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
        Route::post('projects/{project}/logs', [ProjectLogController::class, 'store'])->name('projects.logs.store');
    });

    /*
    |----------------------------------------------------------------------
    | Manager + Admin
    |----------------------------------------------------------------------
    */
    Route::middleware('role:manager,admin')->group(function () {
        Route::patch('leads/{lead}/assign', [LeadController::class, 'assign'])->name('leads.assign');

        // Assign converted leads to executors / remove projects.
        Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
        Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

        Route::get('import', [LeadImportController::class, 'create'])->name('import.create');
        Route::post('import', [LeadImportController::class, 'store'])->name('import.store');
        Route::get('import/template', [LeadImportController::class, 'template'])->name('import.template');

        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
        Route::get('performance', [PerformanceController::class, 'index'])->name('performance.index');
    });

    /*
    |----------------------------------------------------------------------
    | Admin only
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
        Route::post('staff', [StaffController::class, 'store'])->name('staff.store');
        Route::patch('staff/{user}', [StaffController::class, 'update'])->name('staff.update');
        Route::delete('staff/{user}', [StaffController::class, 'destroy'])->name('staff.destroy');

        // Danger zone: wipe all leads/tasks/projects (keeps users/roles/sources/tags).
        Route::post('settings/clear-data', [SettingsController::class, 'clearData'])->name('settings.clearData');
    });
});
