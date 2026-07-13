<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RoleRequest;
use App\Models\User;
use Spatie\Permission\Models\Role;

class RoleRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        /*
        |--------------------------------------------------------------------------
        | ROLES (NO RESTRICTION ON SUPER-ADMIN HERE)
        |--------------------------------------------------------------------------
        */
        $roles = Role::whereIn('name', [
            'admin',
            'agent',
            'landlord',
            'tenant',
            'technician',
            'accountant',
            'customer',
        ])->get();

        if ($users->isEmpty() || $roles->isEmpty()) {
            $this->command->warn('Users or roles missing. Seed them first.');
            return;
        }

        $statuses = [
            RoleRequest::STATUS_PENDING,
            RoleRequest::STATUS_APPROVED,
            RoleRequest::STATUS_REJECTED,
        ];

        foreach ($users as $index => $user) {

            $role = $roles->random();
            $status = $statuses[$index % 3];

            RoleRequest::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'requested_role' => $role->name,
                ],
                [
                    'reason' => $this->getReason($role->name),
                    'status' => $status,

                    /*
                    |--------------------------------------------------------------------------
                    | REVIEWER CAN BE ADMIN OR SUPER-ADMIN
                    |--------------------------------------------------------------------------
                    */
                    'reviewed_by' => $this->getReviewerId($status),

                    'admin_notes' => $this->getNotes($status),

                    'created_at' => now()->subDays(rand(1, 14)),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('Role Requests seeded WITH admin + super-admin reviewers.');
    }

    /*
    |--------------------------------------------------------------------------
    | REALISTIC REASONS
    |--------------------------------------------------------------------------
    */
    private function getReason(string $role): string
    {
        return match ($role) {

            'agent' =>
                "I have experience in real estate sales and would like to help clients buy and rent properties through the platform.",

            'landlord' =>
                "I own rental properties and need tools to manage tenants, payments, and maintenance efficiently.",

            'tenant' =>
                "I am looking for verified rental properties and want to manage my tenancy digitally.",

            'technician' =>
                "I provide maintenance and repair services and want to receive service requests from property owners.",

            'accountant' =>
                "I manage financial records and need access to payments and reporting tools.",

            'admin' =>
                "I support system operations and require administrative access to manage users and properties.",

            'customer' =>
                "I want to use the platform as a regular user to explore services and properties.",

            default =>
                "I would like to upgrade my account role for additional access.",
        };
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN NOTES
    |--------------------------------------------------------------------------
    */
    private function getNotes(string $status): ?string
    {
        return match ($status) {

            RoleRequest::STATUS_APPROVED =>
                "Approved after verification of user eligibility and role requirements.",

            RoleRequest::STATUS_REJECTED =>
                "Rejected due to insufficient documentation or role mismatch.",

            default => null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEWER (ADMIN OR SUPER-ADMIN)
    |--------------------------------------------------------------------------
    */
    private function getReviewerId(string $status): ?int
    {
        if ($status === RoleRequest::STATUS_PENDING) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | RANDOMLY ASSIGN ADMIN OR SUPER-ADMIN
        |--------------------------------------------------------------------------
        */
        $reviewers = User::role(['admin', 'super-admin'])->pluck('id');

        return $reviewers->isNotEmpty()
            ? $reviewers->random()
            : null;
    }
}