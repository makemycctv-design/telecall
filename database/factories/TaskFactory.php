<?php

namespace Database\Factories;

use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'title' => fake()->randomElement(['Follow up call', 'Send proposal', 'Callback', 'Qualify lead', 'Demo reminder']),
            'description' => fake()->optional()->sentence(),
            'type' => fake()->randomElement(TaskType::cases())->value,
            'status' => fake()->randomElement([TaskStatus::Pending, TaskStatus::Pending, TaskStatus::InProgress, TaskStatus::Completed])->value,
            'due_at' => fake()->dateTimeBetween('-2 days', '+5 days'),
            'time_spent_seconds' => fake()->numberBetween(0, 3600),
        ];
    }
}
