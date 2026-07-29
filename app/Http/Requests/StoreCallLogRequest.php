<?php

namespace App\Http\Requests;

use App\Enums\CallOutcome;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCallLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\CallLog::class);
    }

    public function rules(): array
    {
        return [
            'lead_id' => ['required', 'exists:leads,id'],
            'task_id' => ['nullable', 'exists:tasks,id'],
            'outcome' => ['required', Rule::enum(CallOutcome::class)],
            'started_at' => ['nullable', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'next_follow_up_at' => ['nullable', 'date'],
            'client_uuid' => ['nullable', 'uuid'],
        ];
    }
}
