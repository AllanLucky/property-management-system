<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN
        |--------------------------------------------------------------------------
        */
        $superAdmin = User::firstOrCreate(
            ['email' => 'shehetsory.dev@gmail.com'],
            [
                'first_name'      => 'Super',
                'last_name'       => 'Admin',
                'phone'           => '0700000000',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );

        $superAdmin->syncRoles(['super-admin']);

        /*
        |--------------------------------------------------------------------------
        | ADMIN
        |--------------------------------------------------------------------------
        */
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name'      => 'System',
                'last_name'       => 'Admin',
                'phone'           => '0700000001',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );

        $admin->syncRoles(['admin']);

        /*
        |--------------------------------------------------------------------------
        | REAL USERS (YOUR DATA)
        |--------------------------------------------------------------------------
        */

        // USER 1 - Allen Mzungu (LANDLORD)
        $allen = User::firstOrCreate(
            ['email' => 'allandevtech@gmail.com'],
            [
                'first_name'      => 'Allen',
                'last_name'       => 'Mzungu',
                'phone'           => '0702103254',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );

        $allen->syncRoles(['landlord']);

        // USER 2 - Allan Nonda (TENANT)
        $allan = User::firstOrCreate(
            ['email' => 'allantsory.dev@gmail.com'],
            [
                'first_name'      => 'Allan',
                'last_name'       => 'Nonda',
                'phone'           => '0792491361',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );

        $allan->syncRoles(['tenant']);

        /*
        |--------------------------------------------------------------------------
        | EXTRA SYSTEM USERS
        |--------------------------------------------------------------------------
        */

        $agent = User::firstOrCreate(
            ['email' => 'agent@example.com'],
            [
                'first_name'      => 'John',
                'last_name'       => 'Agent',
                'phone'           => '0700000002',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );
        $agent->syncRoles(['agent']);

        $landlord = User::firstOrCreate(
            ['email' => 'landlord@example.com'],
            [
                'first_name'      => 'Jane',
                'last_name'       => 'Landlord',
                'phone'           => '0700000003',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );
        $landlord->syncRoles(['landlord']);

        $tenant = User::firstOrCreate(
            ['email' => 'tenant@example.com'],
            [
                'first_name'      => 'Mike',
                'last_name'       => 'Tenant',
                'phone'           => '0700000004',
                'password'        => Hash::make('35600879'),

                'is_verified'     => true,
                'account_status'  => 'active',
                'approval_status' => 'approved',
            ]
        );
        $tenant->syncRoles(['tenant']);
    }
}