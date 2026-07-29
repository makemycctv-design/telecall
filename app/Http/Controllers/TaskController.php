<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->string('filter', 'today')->toString();

        $base = Task::query()
            ->forUser($request->user())
            ->with(['lead:id,name,phone', 'assignee:id,name']);

        $tasks = (clone $base)
            ->when($filter === 'today', fn ($q) => $q->dueToday())
            ->when($filter === 'overdue', fn ($q) => $q->overdue())
            ->when($filter === 'upcoming', fn ($q) => $q->open()->whereDate('due_at', '>', today()))
            ->when($filter === 'completed', fn ($q) => $q->where('status', TaskStatus::Completed->value))
            ->orderByRaw('due_at IS NULL, due_at asc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filter' => $filter,
            'counts' => [
                'today' => (clone $base)->dueToday()->count(),
                'overdue' => (clone $base)->overdue()->count(),
                'upcoming' => (clone $base)->open()->whereDate('due_at', '>', today())->count(),
                'completed' => (clone $base)->where('status', TaskStatus::Completed->value)->count(),
            ],
            'taskTypes' => collect(TaskType::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()]),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['status'] = TaskStatus::Pending->value;
        $data['type'] ??= TaskType::Custom->value;

        Task::create($data);

        return back()->with('success', 'Task created.');
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $task->update($request->validated());

        return back()->with('success', 'Task updated.');
    }

    /** Start the task timer. */
    public function start(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $task->forceFill([
            'status' => TaskStatus::InProgress->value,
            'started_at' => $task->started_at ?? now(),
        ])->save();

        return back();
    }

    /** Stop the timer, accumulating elapsed time. */
    public function stop(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        if ($task->started_at) {
            $elapsed = (int) now()->diffInSeconds($task->started_at, true);
            $task->time_spent_seconds += $elapsed;
        }
        $task->forceFill(['status' => TaskStatus::Pending->value, 'started_at' => null])->save();

        return back();
    }

    public function complete(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        if ($task->started_at) {
            $task->time_spent_seconds += (int) now()->diffInSeconds($task->started_at, true);
        }
        $task->forceFill([
            'status' => TaskStatus::Completed->value,
            'completed_at' => now(),
            'started_at' => null,
        ])->save();

        return back()->with('success', 'Task completed.');
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);
        $task->delete();

        return back()->with('success', 'Task deleted.');
    }
}
