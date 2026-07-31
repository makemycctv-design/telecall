<?php

namespace Database\Seeders;

use App\Enums\RoleType;
use App\Models\CallLog;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStatusHistory;
use App\Models\LeadTag;
use App\Models\Role;
use App\Models\Task;
use App\Models\User;
use App\Services\MetricsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Idempotent seeder — safe to run multiple times.
     *
     * Core data (roles, three demo login users, sources, tags) is always
     * created and needs no faker, so it runs fine on production
     * (`composer install --no-dev`). The large volume of demo leads/calls/tasks
     * only runs when faker is available (i.e. dev with dev-dependencies).
     */
    public function run(): void
    {
        // ---- Roles (idempotent) -----------------------------------------
        foreach ([
            [RoleType::Admin->value, 'Administrator', 'Full system access'],
            [RoleType::Manager->value, 'Manager', 'Team management & reporting'],
            [RoleType::Telecaller->value, 'Telecaller', 'Lead calling & tasks'],
            [RoleType::Executor->value, 'Executor', 'Executes converted-lead projects'],
        ] as [$slug, $name, $desc]) {
            Role::firstOrCreate(['slug' => $slug], ['name' => $name, 'description' => $desc]);
        }

        // ---- Demo login users (idempotent) ------------------------------
        $admin = $this->ensureUser('Admin User', 'admin@telecrm.test', RoleType::Admin);
        $manager = $this->ensureUser('Manager Mary', 'manager@telecrm.test', RoleType::Manager);
        $primaryCaller = $this->ensureUser('Telecaller Tom', 'telecaller@telecrm.test', RoleType::Telecaller, $manager->id);
        $executor = $this->ensureUser('Executor Eva', 'executor@telecrm.test', RoleType::Executor, $manager->id);

        // ---- Lookup data (idempotent) -----------------------------------
        foreach (['Website', 'Facebook', 'Referral', 'Cold Call', 'LinkedIn'] as $name) {
            LeadSource::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'is_active' => true]);
        }
        foreach ([['Hot', 'rose'], ['Enterprise', 'violet'], ['SMB', 'blue'], ['Renewal', 'emerald']] as [$name, $color]) {
            LeadTag::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'color' => $color]);
        }

        // ---- Sample product catalogue (idempotent) ----------------------
        $catalogue = [
            'CCTV Cameras' => [
                ['Dome Camera 2MP', 1500, 18],
                ['Bullet Camera 4MP', 2200, 18],
                ['PTZ Camera', 8500, 18],
            ],
            'Recorders' => [
                ['DVR 4-Channel', 3200, 18],
                ['NVR 8-Channel', 6500, 18],
            ],
            'Services' => [
                ['Installation & Setup', 2000, 18],
                ['Annual Maintenance', 3500, 18],
            ],
        ];
        foreach ($catalogue as $categoryName => $products) {
            $category = \App\Models\Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName, 'is_active' => true],
            );
            foreach ($products as [$pName, $price, $tax]) {
                \App\Models\Product::firstOrCreate(
                    ['name' => $pName],
                    ['category_id' => $category->id, 'price' => $price, 'tax_percent' => $tax, 'is_active' => true],
                );
            }
        }

        // ---- Bulk demo data (dev only — requires faker) -----------------
        if (function_exists('fake')) {
            $this->seedDemoData($manager, $primaryCaller);
            $this->seedDemoProject($manager, $executor);
        } else {
            $this->command?->warn('faker unavailable (--no-dev): skipped bulk demo leads. Core data seeded.');
        }

        app(MetricsService::class)->aggregateAllForDate(Carbon::today());

        $this->command?->info('Seeded roles + demo users.');
        $this->command?->info('Login (password "password"):');
        $this->command?->info('  admin@telecrm.test · manager@telecrm.test · telecaller@telecrm.test · executor@telecrm.test');
    }

    /**
     * Seed one sample converted lead handed off to the executor as a project
     * with a couple of daily work-log entries, so the workflow is visible.
     */
    private function seedDemoProject(User $manager, User $executor): void
    {
        if (\App\Models\Project::count() > 0) {
            return;
        }

        // Pick (or create) a converted lead to attach the project to.
        $lead = Lead::where('status', \App\Enums\LeadStatus::Converted->value)->first()
            ?? Lead::factory()->create([
                'status' => \App\Enums\LeadStatus::Converted->value,
                'assigned_to' => $manager->id,
                'created_by' => $manager->id,
                'converted_at' => now(),
            ]);

        $project = \App\Models\Project::create([
            'lead_id' => $lead->id,
            'assigned_to' => $executor->id,
            'assigned_by' => $manager->id,
            'title' => "Onboarding — {$lead->name}",
            'description' => "Complete onboarding & delivery for {$lead->name}: kickoff call, requirement gathering, setup, and handover.",
            'status' => \App\Enums\ProjectStatus::InProgress->value,
            'progress_percent' => 40,
            'start_date' => now()->subDays(2)->toDateString(),
            'duration_days' => 7,
            'deadline' => now()->addDays(5)->toDateString(),
        ]);

        \App\Models\ProjectLog::create([
            'project_id' => $project->id,
            'user_id' => $executor->id,
            'log_date' => now()->subDays(2)->toDateString(),
            'activities' => 'Kickoff call completed and requirements documented.',
            'progress_percent' => 20,
            'hours_spent' => 3,
            'remarks' => null,
        ]);
        \App\Models\ProjectLog::create([
            'project_id' => $project->id,
            'user_id' => $executor->id,
            'log_date' => now()->subDay()->toDateString(),
            'activities' => 'Environment setup and initial configuration done.',
            'progress_percent' => 40,
            'hours_spent' => 5,
            'remarks' => 'Waiting on client asset delivery for the next step.',
        ]);
    }

    private function seedDemoData(User $manager, User $primaryCaller): void
    {
        // Only generate the big demo set once.
        if (Lead::count() > 0) {
            return;
        }

        $telecallers = collect([$primaryCaller]);
        foreach (range(1, 4) as $i) {
            $u = User::factory()->create(['manager_id' => $manager->id]);
            $u->roles()->syncWithoutDetaching(Role::where('slug', RoleType::Telecaller->value)->pluck('id'));
            $telecallers->push($u);
        }

        $sources = LeadSource::pluck('id');
        $tags = LeadTag::pluck('id');

        Lead::factory(120)->make()->each(function (Lead $lead) use ($telecallers, $sources, $tags, $manager) {
            $assignee = $telecallers->random();
            $lead->assigned_to = $assignee->id;
            $lead->created_by = $manager->id;
            $lead->lead_source_id = $sources->random();
            $lead->save();

            $lead->tags()->attach($tags->random(rand(0, 2))->all());

            LeadStatusHistory::create([
                'lead_id' => $lead->id,
                'changed_by' => $assignee->id,
                'from_status' => null,
                'to_status' => $lead->status->value,
                'note' => 'Seeded',
            ]);

            if (rand(0, 1)) {
                CallLog::factory(rand(1, 3))->make()->each(function (CallLog $call) use ($lead, $assignee) {
                    $call->lead_id = $lead->id;
                    $call->user_id = $assignee->id;
                    $call->save();
                });
            }

            if (rand(0, 1)) {
                Task::factory()->make([
                    'lead_id' => $lead->id,
                    'assigned_to' => $assignee->id,
                    'created_by' => $assignee->id,
                ])->save();
            }
        });
    }

    private function ensureUser(string $name, string $email, RoleType $role, ?int $managerId = null): User
    {
        // Look up including soft-deleted rows — the email unique index also
        // covers trashed users, so a plain firstOrCreate would try to re-insert
        // a previously-deleted account and violate the constraint.
        $user = User::withTrashed()->firstOrNew(['email' => $email]);

        $user->name = $name;
        $user->manager_id = $managerId;
        $user->is_active = true;
        if (! $user->exists) {
            $user->password = Hash::make('password');
            $user->email_verified_at = now();
        }
        if ($user->trashed()) {
            $user->deleted_at = null; // restore a previously-deleted account
        }
        $user->save();

        $user->roles()->syncWithoutDetaching(Role::where('slug', $role->value)->pluck('id'));

        return $user;
    }
}
