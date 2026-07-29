<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('task'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['nullable', Rule::enum(TaskType::class)],
            'status' => ['nullable', Rule::enum(TaskStatus::class)],
            'due_at' => ['nullable', 'date'],
        ];
    }
}
