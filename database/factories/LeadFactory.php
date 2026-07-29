<?php

namespace Database\Factories;

use App\Enums\LeadPriority;
use App\Enums\LeadStatus;
use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    protected $model = Lead::class;

    public function definition(): array
    {
        $status = fake()->randomElement(LeadStatus::cases());

        return [
            'name' => fake()->name(),
            'company' => fake()->optional()->company(),
            'email' => fake()->optional()->safeEmail(),
            'phone' => fake()->numerify('+1##########'),
            'city' => fake()->optional()->city(),
            'status' => $status->value,
            'priority' => fake()->randomElement(LeadPriority::cases())->value,
            'deal_value' => fake()->optional()->randomFloat(2, 500, 50000),
            'notes' => fake()->optional()->sentence(),
            'last_contacted_at' => fake()->optional()->dateTimeBetween('-10 days', 'now'),
            'next_follow_up_at' => fake()->optional()->dateTimeBetween('-3 days', '+7 days'),
            'converted_at' => $status === LeadStatus::Converted ? now() : null,
        ];
    }
}
