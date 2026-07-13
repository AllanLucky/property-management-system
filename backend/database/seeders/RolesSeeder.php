<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SYSTEM ROLES
        |--------------------------------------------------------------------------
        | IMPORTANT:
        | "customer" is the default role for ALL newly registered users
        */
        $roles = [

            /*
            |--------------------------------------------------------------
            | SUPER ADMIN
            | Full system access
            */
            [
                'name' => 'super-admin',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | ADMIN
            | Manages system operations
            */
            [
                'name' => 'admin',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | AGENT
            | Property sales & management
            */
            [
                'name' => 'agent',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | LANDLORD
            */
            [
                'name' => 'landlord',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | TENANT
            */
            [
                'name' => 'tenant',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | TECHNICIAN
            */
            [
                'name' => 'technician',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | ACCOUNTANT
            */
            [
                'name' => 'accountant',
                'guard_name' => 'web',
            ],

            /*
            |--------------------------------------------------------------
            | DEFAULT ROLE (VERY IMPORTANT)
            | This is assigned automatically on registration
            */
            [
                'name' => 'user',
                'guard_name' => 'web',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE ROLES
        |--------------------------------------------------------------------------
        */
        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                ['guard_name' => $role['guard_name']]
            );
        }
    }
}