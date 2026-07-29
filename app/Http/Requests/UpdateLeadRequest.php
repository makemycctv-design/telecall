<?php

namespace App\Http\Requests;

use App\Enums\LeadPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('lead'));
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:32'],
            'alt_phone' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:120'],
            'priority' => ['nullable', Rule::enum(LeadPriority::class)],
            'lead_source_id' => ['nullable', 'exists:lead_sources,id'],
            'deal_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'next_follow_up_at' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:lead_tags,id'],
        ];
    }
}
