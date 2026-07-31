<?php

namespace App\Http\Controllers;

use App\Support\CrmDataCleaner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Admin-only: wipe all leads, tasks and projects (and related records),
     * keeping users, roles, sources and tags. Requires typing the confirmation
     * phrase to guard against accidents.
     */
    public function clearData(Request $request): RedirectResponse
    {
        $request->validate([
            'confirm' => ['required', 'in:DELETE'],
        ], [], ['confirm' => 'confirmation']);

        $result = CrmDataCleaner::clear();
        $total = array_sum($result);

        return back()->with('success', "Cleared all leads, tasks and projects ({$total} records removed).");
    }
}
