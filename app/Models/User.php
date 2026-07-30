<?php

namespace App\Models;

use App\Enums\RoleType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'manager_id', 'is_active', 'last_active_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ---- Relationships ---------------------------------------------------

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(User::class, 'manager_id');
    }

    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_to');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }

    public function assignedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'assigned_to');
    }

    public function projectLogs(): HasMany
    {
        return $this->hasMany(ProjectLog::class);
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class);
    }

    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function dailyMetrics(): HasMany
    {
        return $this->hasMany(DailyStaffMetric::class);
    }

    // ---- Role helpers ----------------------------------------------------

    public function hasRole(RoleType|string $role): bool
    {
        $slug = $role instanceof RoleType ? $role->value : $role;

        return $this->roles->contains('slug', $slug);
    }

    public function hasAnyRole(array $roles): bool
    {
        $slugs = array_map(fn ($r) => $r instanceof RoleType ? $r->value : $r, $roles);

        return $this->roles->pluck('slug')->intersect($slugs)->isNotEmpty();
    }

    public function primaryRole(): ?Role
    {
        // Highest privilege wins: admin > manager > executor > telecaller.
        $order = [
            RoleType::Admin->value => 4,
            RoleType::Manager->value => 3,
            RoleType::Executor->value => 2,
            RoleType::Telecaller->value => 1,
        ];

        return $this->roles->sortByDesc(fn (Role $r) => $order[$r->slug] ?? 0)->first();
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(RoleType::Admin);
    }

    public function isManager(): bool
    {
        return $this->hasRole(RoleType::Manager);
    }

    public function isTelecaller(): bool
    {
        return $this->hasRole(RoleType::Telecaller);
    }

    public function isExecutor(): bool
    {
        return $this->hasRole(RoleType::Executor);
    }

    // ---- Scopes ----------------------------------------------------------

    public function scopeTelecallers($query)
    {
        return $query->whereHas('roles', fn ($q) => $q->where('slug', RoleType::Telecaller->value));
    }

    public function scopeExecutors($query)
    {
        return $query->whereHas('roles', fn ($q) => $q->where('slug', RoleType::Executor->value));
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
