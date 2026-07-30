<?php

namespace App\Http\Requests;

use App\Enums\RoleType;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Project::class);
    }

    public function rules(): array
    {
        return [
            'lead_id' => ['required', 'exists:leads,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date' => ['nullable', 'date'],
            // Provide EITHER a number of days OR an explicit deadline.
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'deadline' => ['nullable', 'date'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (! $this->filled('duration_days') && ! $this->filled('deadline')) {
                    $validator->errors()->add('duration_days', 'Provide a deadline or a number of days to complete.');
                }

                // Ensure the assignee actually holds the Executor role.
                $assignee = User::with('roles')->find($this->input('assigned_to'));
                if ($assignee && ! $assignee->hasRole(RoleType::Executor)) {
                    $validator->errors()->add('assigned_to', 'The selected user is not an Executor.');
                }
            },
        ];
    }
}
