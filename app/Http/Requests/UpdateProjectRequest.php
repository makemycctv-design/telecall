<?php

namespace App\Http\Requests;

use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('project'));
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
            'progress_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            // Managers may also adjust these; executors typically only touch status/progress.
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'deadline' => ['nullable', 'date'],
        ];
    }
}
