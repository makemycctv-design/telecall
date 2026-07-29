<?php

namespace App\Http\Controllers;

use App\Models\DailyStaffMetric;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceController extends Controller
{
    /**
     * Staff performance & activity monitoring for managers/admins.
     */
    public function index(Request $request): Response
    {
        $from = Carbon::parse($request->input('from', now()->startOfMonth()->toDateString()));
        $to = Carbon::parse($request->input('to', now()->toDateString()));

        $user = $request->user();
        $staffQuery = User::telecallers()->active();
        if ($user->isManager()) {
            $staffQuery->where('manager_id', $user->id);
        }
        $staffIds = $staffQuery->pluck('id');

        $metrics = DailyStaffMetric::query()
            ->whereIn('user_id', $staffIds)
            ->whereBetween('metric_date', [$from->toDateString(), $to->toDateString()])
            ->with('user:id,name')
            ->get();

        // Per-staff rollup across the selected period.
        $byStaff = $metrics->groupBy('user_id')->map(function ($rows) {
            $first = $rows->first();
            $callsMade = $rows->sum('calls_made');
            $connected = $rows->sum('calls_connected');

            return [
                'user_id' => $first->user_id,
                'name' => $first->user?->name,
                'calls_made' => $callsMade,
                'calls_connected' => $connected,
                'talk_time_seconds' => $rows->sum('talk_time_seconds'),
                'follow_ups_completed' => $rows->sum('follow_ups_completed'),
                'tasks_completed' => $rows->sum('tasks_completed'),
                'tasks_overdue' => $rows->max('tasks_overdue'),
                'leads_interested' => $rows->sum('leads_interested'),
                'leads_converted' => $rows->sum('leads_converted'),
                'connect_rate' => $callsMade > 0 ? round($connected / $callsMade * 100, 1) : 0,
            ];
        })->values();

        // Daily trend for the activity chart.
        $trend = $metrics->groupBy(fn ($m) => $m->metric_date->toDateString())
            ->map(fn ($rows, $day) => [
                'date' => $day,
                'calls' => $rows->sum('calls_made'),
                'converted' => $rows->sum('leads_converted'),
            ])->sortKeys()->values();

        return Inertia::render('Reports/Performance', [
            'byStaff' => $byStaff,
            'trend' => $trend,
            'totals' => [
                'calls_made' => $metrics->sum('calls_made'),
                'talk_time_seconds' => $metrics->sum('talk_time_seconds'),
                'converted' => $metrics->sum('leads_converted'),
                'follow_ups' => $metrics->sum('follow_ups_completed'),
            ],
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }
}
