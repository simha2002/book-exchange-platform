<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin account (skip if already exists)
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'               => 'Admin',
                'email'              => 'admin@gmail.com',
                'password'           => Hash::make('admin123'),
                'role'               => 'admin',
                'is_email_verified'  => true,
            ]
        );
    }
}
