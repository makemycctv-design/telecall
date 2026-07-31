<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvertQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isTelecaller() || $this->user()->isManager() || $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'advance_amount' => ['nullable', 'numeric', 'min:0'],
            'issued_at' => ['nullable', 'date'],
        ];
    }
}
