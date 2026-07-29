<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('assign', $this->route('lead'));
    }

    public function rules(): array
    {
        return [
            'assigned_to' => ['required', 'exists:users,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
