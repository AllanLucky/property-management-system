<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | RESET CACHE (IMPORTANT FOR SPATIE)
        |--------------------------------------------------------------------------
        */
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS LIST
        |--------------------------------------------------------------------------
        */
        $permissions = [

            // ================= USERS =================
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.manage',

            // ================= ROLES =================
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'roles.assign',

            // ================= PROPERTY CATEGORIES =================
            'property categories.view',
            'property categories.create',
            'property categories.edit',
            'property categories.delete',
            'property categories.restore',
            'property categories.force delete',

            // ================= PROPERTIES =================
            'properties.view',
            'properties.create',
            'properties.edit',
            'properties.delete',
            'properties.manage',

            // ================= APARTMENTS =================
            'apartments.view',
            'apartments.create',
            'apartments.edit',
            'apartments.delete',
            'apartments.manage',

            // ================= UNITS =================
            'units.view',
            'units.create',
            'units.edit',
            'units.delete',
            'units.manage',

            // ================= BOOKINGS =================
            'bookings.view',
            'bookings.create',
            'bookings.edit',
            'bookings.cancel',
            'bookings.manage',

            // ================= TENANCIES =================
            'tenancies.view',
            'tenancies.create',
            'tenancies.edit',
            'tenancies.terminate',
            'tenancies.manage',

            // ================= MAINTENANCE =================
            'maintenance.view',
            'maintenance.create',
            'maintenance.edit',
            'maintenance.assign',
            'maintenance.update',
            'maintenance.resolve',
            'maintenance.manage',

            // ================= PAYMENTS =================
            'payments.view',
            'payments.create',
            'payments.update',
            'payments.refund',
            'payments.manage',

            // ================= INVOICES =================
            'invoices.view',
            'invoices.create',
            'invoices.edit',
            'invoices.delete',
            'invoices.send',
            'invoices.mark_paid',
            'invoices.cancel',
            'invoices.manage',

            // ================= EXPENSES =================
            'expenses.view',
            'expenses.create',
            'expenses.edit',
            'expenses.delete',
            'expenses.approve',
            'expenses.reject',
            'expenses.manage',

            // ================= EXPENSE CATEGORIES =================
            'expense_categories.view',
            'expense_categories.create',
            'expense_categories.edit',
            'expense_categories.delete',
            'expense_categories.manage',

            // ================= FINANCE =================
            'finance.reports.view',
            'finance.reports.export',
            'finance.reports.cashflow',
            'finance.reports.profit_loss',
            'finance.dashboard.view',

            // ================= CHAT =================
            'chat.view',
            'chat.create',
            'chat.send',
            'chat.delete',
            'chat.manage',

            // ================= CAMPAIGNS =================
            'campaigns.view',
            'campaigns.create',
            'campaigns.edit',
            'campaigns.delete',
            'campaigns.publish',
            'campaigns.manage',

            // ================= ANNOUNCEMENTS =================
            'announcements.view',
            'announcements.create',
            'announcements.edit',
            'announcements.delete',
            'announcements.publish',
            'announcements.manage',

            // ================= PLOTS =================
            'plots.view',
            'plots.create',
            'plots.edit',
            'plots.delete',
            'plots.manage',

            // ================= PLOT SALES =================
            'plot_sales.view',
            'plot_sales.create',
            'plot_sales.edit',
            'plot_sales.approve',
            'plot_sales.reject',
            'plot_sales.manage',

            // ================= PLOT PAYMENTS =================
            'plot_payments.view',
            'plot_payments.create',
            'plot_payments.edit',
            'plot_payments.verify',
            'plot_payments.manage',

            // ================= SYSTEM =================
            'system.manage',
        ];

        /*
        |--------------------------------------------------------------------------
        | INSERT PERMISSIONS
        |--------------------------------------------------------------------------
        */
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        /*
        |--------------------------------------------------------------------------
        | ROLES (OPTIONAL BUT PROFESSIONAL)
        |--------------------------------------------------------------------------
        */
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $agent = Role::firstOrCreate(['name' => 'agent']);
        $landlord = Role::firstOrCreate(['name' => 'landlord']);
        $tenant = Role::firstOrCreate(['name' => 'tenant']);

        /*
        |--------------------------------------------------------------------------
        | PERMISSION ASSIGNMENT
        |--------------------------------------------------------------------------
        */
        $superAdmin->syncPermissions(Permission::all());

        $admin->syncPermissions(Permission::where('name', '!=', 'system.manage')->get());
    }
}