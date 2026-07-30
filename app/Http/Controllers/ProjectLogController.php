<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectLogRequest;
use App\Models\Project;
use App\Models\ProjectLog;
use Illuminate\Http\RedirectResponse;

class ProjectLogController extends Controller
{
    /**
     * Executor records a daily work-log entry against a project.
     * First log moves a pending project into "in progress"; an optional
     * progress update is mirrored onto the project.
     */
    public function store(StoreProjectLogRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();

        ProjectLog::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'log_date' => $data['log_date'],
            'activities' => $data['activities'],
            'progress_percent' => $data['progress_percent'] ?? null,
            'hours_spent' => $data['hours_spent'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ]);

        // Reflect progress on the project and auto-advance status.
        $dirty = false;
        if ($project->status === ProjectStatus::Pending) {
            $project->status = ProjectStatus::InProgress;
            $dirty = true;
        }
        if (isset($data['progress_percent'])) {
            $project->progress_percent = $data['progress_percent'];
            if ($data['progress_percent'] >= 100) {
                $project->status = ProjectStatus::Completed;
                $project->completed_at = now();
            }
            $dirty = true;
        }
        if ($dirty) {
            $project->save();
        }

        return back()->with('success', 'Daily log added.');
    }
}
