<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportLeadsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isManager() || $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            // Secure upload validation: enforce extension + mime + size.
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
            'auto_assign' => ['nullable', 'boolean'],
        ];
    }
}
