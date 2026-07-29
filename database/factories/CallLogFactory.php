<?php

namespace Database\Factories;

use App\Enums\CallOutcome;
use App\Models\CallLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CallLog>
 */
class CallLogFactory extends Factory
{
    protected $model = CallLog::class;

    public function definition(): array
    {
        $started = fake()->dateTimeBetween('-7 days', 'now');
        $duration = fake()->numberBetween(0, 900);

        return [
            'outcome' => fake()->randomElement(CallOutcome::cases())->value,
            'started_at' => $started,
            'ended_at' => (clone $started)->modify("+{$duration} seconds"),
            'duration_seconds' => $duration,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
