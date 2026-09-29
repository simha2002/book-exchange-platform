<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    // Get my profile
    public function profile(Request $request)
    {
        $user = $request->user()->loadCount('books');

        return response()->json(['user' => $user]);
    }

    // Update my profile
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name'   => 'sometimes|string|max:255',
            'phone'  => 'nullable|string|max:20',
            'bio'    => 'nullable|string|max:500',
            'avatar' => 'nullable|image|max:2048',
        ]);

        $user = $request->user();

        $avatarPath = $user->avatar;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update([
            'name'   => $request->name ?? $user->name,
            'phone'  => $request->phone,
            'bio'    => $request->bio,
            'avatar' => $avatarPath,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user,
        ]);
    }

    // Change password
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:5|different:current_password',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->new_password),
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }
    // Admin: get all users
    public function allUsers()
    {
        $users = User::withCount('books')->latest()->get();

        return response()->json(['users' => $users]);
    }

    // Admin: change user role
    public function changeRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:user,admin',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Role updated to ' . $request->role,
            'user'    => $user,
        ]);
    }

    // Admin: delete user
    public function deleteUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
