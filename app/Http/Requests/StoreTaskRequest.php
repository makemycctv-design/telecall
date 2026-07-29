<?php

namespace App\Http\Requests;

use App\Enums\TaskType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Task::class);
    }

    public function rules(): array
    {
        return [
            'lead_id' => ['nullable', 'exists:leads,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['nullable', Rule::enum(TaskType::class)],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
