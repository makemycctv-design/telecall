<?php

namespace App\Providers;

use App\Models\CallLog;
use App\Models\Lead;
use App\Models\Task;
use App\Notifications\Channels\AppDatabaseChannel;
use App\Notifications\Channels\WebPushChannel;
use App\Policies\CallLogPolicy;
use App\Policies\LeadPolicy;
use App\Policies\TaskPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Authorization policies.
        Gate::policy(Lead::class, LeadPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(CallLog::class, CallLogPolicy::class);

        // Custom notification channels resolved by class-name via container.
        // (Referencing the channel FQCN in a notification's via() is supported
        //  natively by Laravel; binding here keeps them singletons.)
        $this->app->singleton(AppDatabaseChannel::class);
        $this->app->singleton(WebPushChannel::class);
    }
}
