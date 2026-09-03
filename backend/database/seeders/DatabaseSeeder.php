<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * ==========================================================================
     * DATABASE SEEDING ORDER
     * ==========================================================================
     *
     * Seeders are executed according to their dependencies.
     *
     * The general dependency flow is:
     *
     * Roles & Permissions
     *        ↓
     * Users
     *        ↓
     * Locations
     *        ↓
     * Property Master Data
     *        ↓
     * Properties
     *        ↓
     * Apartments
     *        ↓
     * Units
     *        ↓
     * Tenants
     *        ↓
     * Tenancies
     *        ↓
     * Leases
     *        ↓
     * Bookings / Maintenance
     *
     * This order helps prevent foreign-key and relationship issues during
     * database seeding.
     */
    public function run(): void
    {
        $this->call([

            /*
            |--------------------------------------------------------------------------
            | 1. ROLES & PERMISSIONS
            |--------------------------------------------------------------------------
            |
            | Create roles and permissions before users so users can safely
            | receive their assigned roles and permissions.
            |
            */

            PermissionsSeeder::class,
            RolesSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 2. USERS
            |--------------------------------------------------------------------------
            |
            | Users are required by several modules including:
            |
            | - Property reviews
            | - Property visits
            | - Property favorites
            | - Bookings
            | - Maintenance
            | - Tenants
            |
            */

            UsersSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 3. LOCATION DATA
            |--------------------------------------------------------------------------
            |
            | Countries, counties, cities and areas must exist before properties
            | and other location-dependent records are created.
            |
            */

            LocationSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 4. PROPERTY MASTER DATA
            |--------------------------------------------------------------------------
            |
            | Master/reference data required when creating properties.
            |
            */

            PropertyTypesSeeder::class,
            PropertyCategoriesSeeder::class,
            PropertyFeaturesSeeder::class,
            AmenitySeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 5. PROPERTIES
            |--------------------------------------------------------------------------
            |
            | Properties depend on:
            |
            | - Location data
            | - Property types
            | - Property categories
            | - Property features
            |
            */

            PropertiesSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 6. PROPERTY RELATIONSHIPS
            |--------------------------------------------------------------------------
            |
            | Attach amenities to existing properties.
            |
            */

            PropertyAmenitySeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 7. PROPERTY REVIEWS
            |--------------------------------------------------------------------------
            |
            | Reviews depend on:
            |
            | - Users
            | - Properties
            |
            */

            PropertyReviewsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 8. PROPERTY VISITS
            |--------------------------------------------------------------------------
            |
            | Visits depend on:
            |
            | - Users
            | - Properties
            |
            */

            PropertyVisitsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 9. PROPERTY FAVORITES
            |--------------------------------------------------------------------------
            |
            | Favorites depend on:
            |
            | - Users
            | - Properties
            |
            */

            PropertyFavoritesSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 10. PROPERTY ANALYTICS
            |--------------------------------------------------------------------------
            |
            | Analytics depend on existing properties and property activity.
            |
            */

            PropertyAnalyticsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 11. APARTMENTS
            |--------------------------------------------------------------------------
            |
            | Apartments depend on properties.
            |
            */

            ApartmentsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 12. UNITS
            |--------------------------------------------------------------------------
            |
            | Units depend on:
            |
            | - Properties
            | - Apartments
            |
            */

            UnitsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 13. TENANTS
            |--------------------------------------------------------------------------
            |
            | Tenants depend on existing users with the tenant role.
            |
            | Tenant-specific profile information is stored in the tenants
            | table while authentication/account information remains in users.
            |
            */

            TenantSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 14. TENANCIES
            |--------------------------------------------------------------------------
            |
            | Tenancies depend on:
            |
            | - Properties
            | - Apartments
            | - Units
            | - Tenants
            |
            */

            TenancySeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 15. LEASES
            |--------------------------------------------------------------------------
            |
            | Leases depend on existing tenancies.
            |
            | A lease represents the legal/contractual agreement associated
            | with a tenancy.
            |
            | Architecture:
            |
            | Tenant
            |    └── Tenancy
            |          └── Lease
            |
            | Tenant, property, apartment and unit information is resolved
            | through the tenancy and is intentionally not duplicated in
            | the leases table.
            |
            */

            LeaseSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 16. BOOKINGS
            |--------------------------------------------------------------------------
            |
            | Bookings depend on:
            |
            | - Users/customers
            | - Tenants
            | - Properties
            | - Apartments
            | - Units
            | - Tenancies
            |
            */

            BookingSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 17. MAINTENANCE
            |--------------------------------------------------------------------------
            |
            | Maintenance records depend on:
            |
            | - Users
            | - Properties
            | - Apartments
            | - Units
            | - Tenants
            |
            */

            MaintenanceSeeder::class,

        ]);
    }
}