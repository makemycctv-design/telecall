<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\LeadStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LeadStatusService
{
    /**
     * Transition a lead to a new status, recording history and side effects.
     */
    public function transition(Lead $lead, LeadStatus $to, ?User $by = null, ?string $note = null): Lead
    {
        $from = $lead->status;

        if ($from === $to) {
            return $lead;
        }

        return DB::transaction(function () use ($lead, $from, $to, $by, $note) {
            $lead->status = $to;

            if ($to === LeadStatus::Converted) {
                $lead->converted_at = now();
            }

            $lead->save();

            LeadStatusHistory::create([
                'lead_id' => $lead->id,
                'changed_by' => $by?->id,
                'from_status' => $from?->value,
                'to_status' => $to->value,
                'note' => $note,
            ]);

            return $lead;
        });
    }
}
