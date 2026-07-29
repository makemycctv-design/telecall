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
    public function run(): void
    {
        // ---- Roles -------------------------------------------------------
        $roles = collect([
            ['slug' => RoleType::Admin->value, 'name' => 'Administrator', 'description' => 'Full system access'],
            ['slug' => RoleType::Manager->value, 'name' => 'Manager', 'description' => 'Team management & reporting'],
            ['slug' => RoleType::Telecaller->value, 'name' => 'Telecaller', 'description' => 'Lead calling & tasks'],
        ])->mapWithKeys(fn ($r) => [$r['slug'] => Role::create($r)]);

        // ---- Demo users --------------------------------------------------
        $admin = $this->makeUser('Admin User', 'admin@telecrm.test');
        $admin->roles()->attach($roles[RoleType::Admin->value]);

        $manager = $this->makeUser('Manager Mary', 'manager@telecrm.test');
        $manager->roles()->attach($roles[RoleType::Manager->value]);

        // Named demo telecaller + a few generated ones, all under the manager.
        $primaryCaller = $this->makeUser('Telecaller Tom', 'telecaller@telecrm.test', $manager->id);
        $primaryCaller->roles()->attach($roles[RoleType::Telecaller->value]);

        $telecallers = collect([$primaryCaller]);
        foreach (range(1, 4) as $i) {
            $u = User::factory()->create(['manager_id' => $manager->id]);
            $u->roles()->attach($roles[RoleType::Telecaller->value]);
            $telecallers->push($u);
        }

        // ---- Lookup data -------------------------------------------------
        $sources = collect(['Website', 'Facebook', 'Referral', 'Cold Call', 'LinkedIn'])
            ->map(fn ($name) => LeadSource::create(['name' => $name, 'slug' => Str::slug($name), 'is_active' => true]));

        $tags = collect(['Hot', 'Enterprise', 'SMB', 'Renewal'])
            ->map(fn ($name, $i) => LeadTag::create([
                'name' => $name,
                'slug' => Str::slug($name),
                'color' => ['rose', 'violet', 'blue', 'emerald'][$i],
            ]));

        // ---- Leads + activity -------------------------------------------
        Lead::factory(120)->make()->each(function (Lead $lead) use ($telecallers, $sources, $tags, $manager) {
            $assignee = $telecallers->random();
            $lead->assigned_to = $assignee->id;
            $lead->created_by = $manager->id;
            $lead->lead_source_id = $sources->random()->id;
            $lead->save();

            $lead->tags()->attach($tags->random(rand(0, 2))->pluck('id')->all());

            LeadStatusHistory::create([
                'lead_id' => $lead->id,
                'changed_by' => $assignee->id,
                'from_status' => null,
                'to_status' => $lead->status->value,
                'note' => 'Seeded',
            ]);

            // A couple of calls + a task for a subset of leads.
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

        // ---- Pre-aggregate today's metrics for the dashboards -----------
        $metrics = app(MetricsService::class);
        $metrics->aggregateAllForDate(Carbon::today());

        $this->command?->info('Seeded roles, 7 users, 120 leads, calls, tasks and metrics.');
        $this->command?->info('Login: admin@telecrm.test / manager@telecrm.test / telecaller@telecrm.test (password: "password")');
    }

    private function makeUser(string $name, string $email, ?int $managerId = null): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'manager_id' => $managerId,
            'is_active' => true,
        ]);
    }
}
