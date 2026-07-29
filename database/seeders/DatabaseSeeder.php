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
        ] as [$slug, $name, $desc]) {
            Role::firstOrCreate(['slug' => $slug], ['name' => $name, 'description' => $desc]);
        }

        // ---- Demo login users (idempotent) ------------------------------
        $admin = $this->ensureUser('Admin User', 'admin@telecrm.test', RoleType::Admin);
        $manager = $this->ensureUser('Manager Mary', 'manager@telecrm.test', RoleType::Manager);
        $primaryCaller = $this->ensureUser('Telecaller Tom', 'telecaller@telecrm.test', RoleType::Telecaller, $manager->id);

        // ---- Lookup data (idempotent) -----------------------------------
        foreach (['Website', 'Facebook', 'Referral', 'Cold Call', 'LinkedIn'] as $name) {
            LeadSource::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'is_active' => true]);
        }
        foreach ([['Hot', 'rose'], ['Enterprise', 'violet'], ['SMB', 'blue'], ['Renewal', 'emerald']] as [$name, $color]) {
            LeadTag::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'color' => $color]);
        }

        // ---- Bulk demo data (dev only — requires faker) -----------------
        if (function_exists('fake')) {
            $this->seedDemoData($manager, $primaryCaller);
        } else {
            $this->command?->warn('faker unavailable (--no-dev): skipped bulk demo leads. Core data seeded.');
        }

        app(MetricsService::class)->aggregateAllForDate(Carbon::today());

        $this->command?->info('Seeded roles + demo users.');
        $this->command?->info('Login: admin@telecrm.test / manager@telecrm.test / telecaller@telecrm.test (password: "password")');
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
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'manager_id' => $managerId,
                'is_active' => true,
            ],
        );

        $user->roles()->syncWithoutDetaching(Role::where('slug', $role->value)->pluck('id'));

        return $user;
    }
}
