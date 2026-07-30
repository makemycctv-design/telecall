<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('addLog', $this->route('project'));
    }

    public function rules(): array
    {
        return [
            'log_date' => ['required', 'date', 'before_or_equal:today'],
            'activities' => ['required', 'string', 'max:5000'],
            'progress_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'hours_spent' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
