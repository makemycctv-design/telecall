<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Lead Assignment
    |--------------------------------------------------------------------------
    | Strategy used by the auto-assignment service when leads are imported or
    | created without an explicit assignee.
    |
    | Supported: "round_robin", "least_loaded", "manual"
    */
    'assignment_strategy' => env('LEAD_ASSIGNMENT_STRATEGY', 'round_robin'),

    /*
    |--------------------------------------------------------------------------
    | Follow-up SLA
    |--------------------------------------------------------------------------
    | A follow-up task is considered "overdue" once its due time passes. Leads
    | with no touch for this many hours are surfaced as "aging".
    */
    'lead_aging_hours' => env('LEAD_AGING_HOURS', 72),

    /*
    |--------------------------------------------------------------------------
    | Web Push (VAPID)
    |--------------------------------------------------------------------------
    */
    'vapid' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('VAPID_SUBJECT', 'mailto:admin@telecrm.test'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Company details (printed on invoice / quotation PDFs)
    |--------------------------------------------------------------------------
    | Logo: place your file at public/images/logo.png (or set COMPANY_LOGO to a
    | path relative to public/). Leave blank to hide the logo.
    */
    'company' => [
        'name' => env('COMPANY_NAME', 'TeleCRM'),
        'address' => env('COMPANY_ADDRESS', ''),
        'phone' => env('COMPANY_PHONE', ''),
        'email' => env('COMPANY_EMAIL', ''),
        'gstin' => env('COMPANY_GSTIN', ''),
        'website' => env('COMPANY_WEBSITE', ''),
        'logo' => env('COMPANY_LOGO', 'images/logo.png'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto status transitions
    |--------------------------------------------------------------------------
    | Maps a call outcome to the lead status it should set automatically.
    | Consumed by the CallLogService. Keys/values are enum backing values.
    */
    'outcome_status_map' => [
        'interested' => 'interested',
        'not_interested' => 'not_interested',
        'callback_requested' => 'callback',
        'converted' => 'converted',
        'connected' => 'in_progress',
    ],
];
