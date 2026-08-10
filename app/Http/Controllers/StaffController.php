<?php

namespace App\Http\Controllers;

use App\Enums\RoleType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $staff = User::query()
            ->with('roles:id,slug,name')
            ->withCount(['assignedLeads', 'callLogs'])
            ->when($request->string('search')->toString(), fn ($q, $s) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
            'roles' => Role::get(['id', 'slug', 'name']),
            'managers' => User::whereHas('roles', fn ($q) => $q->where('slug', RoleType::Manager->value))
                ->get(['id', 'name']),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['required', Password::defaults()],
            'role' => ['required', Rule::in(RoleType::values())],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'manager_id' => $data['manager_id'] ?? null,
            'is_active' => true,
        ]);

        $user->roles()->sync(Role::where('slug', $data['role'])->pluck('id'));

        return back()->with('success', 'Staff member created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'password' => ['nullable', 'string', 'min:8'],
            'is_active' => ['nullable', 'boolean'],
            'role' => ['nullable', Rule::in(RoleType::values())],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        $updateData = collect($data)->except('role', 'password')->toArray();

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (! empty($data['role'])) {
            $user->roles()->sync(Role::where('slug', $data['role'])->pluck('id'));
        }

        return back()->with('success', 'Staff member updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return back()->with('success', 'Staff member deactivated.');
    }
}
