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
     * Seeders are executed according to their database dependencies.
     *
     * General dependency flow:
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
     * Property Relationships / Activity
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
     * Payments
     *        ↓
     * Bookings / Maintenance
     *
     * The order is important because most operational and financial records
     * depend on records created earlier in the chain.
     */
    public function run(): void
    {
        $this->call([

            /*
            |--------------------------------------------------------------------------
            | 1. ROLES & PERMISSIONS
            |--------------------------------------------------------------------------
            |
            | Roles and permissions must exist before users are created because
            | users may be assigned roles during the user seeding process.
            |
            */

            PermissionsSeeder::class,
            RolesSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 2. USERS
            |--------------------------------------------------------------------------
            |
            | Users are core application accounts and are referenced by several
            | modules throughout the system.
            |
            | Dependencies:
            |
            | - Roles
            | - Permissions
            |
            */

            UsersSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 3. LOCATION DATA
            |--------------------------------------------------------------------------
            |
            | Countries, counties, cities, areas and other location records
            | must exist before properties are created.
            |
            */

            LocationSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 4. PROPERTY MASTER DATA
            |--------------------------------------------------------------------------
            |
            | Reference/master data required by the property module.
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
            | 6. PROPERTY AMENITIES
            |--------------------------------------------------------------------------
            |
            | Attach existing amenities to existing properties.
            |
            | Dependencies:
            |
            | - Properties
            | - Amenities
            |
            */

            PropertyAmenitySeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 7. PROPERTY REVIEWS
            |--------------------------------------------------------------------------
            |
            | Reviews depend on existing users and properties.
            |
            */

            PropertyReviewsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 8. PROPERTY VISITS
            |--------------------------------------------------------------------------
            |
            | Visits depend on existing users and properties.
            |
            */

            PropertyVisitsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 9. PROPERTY FAVORITES
            |--------------------------------------------------------------------------
            |
            | Favorites depend on existing users and properties.
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
            | Apartments belong to properties.
            |
            | Dependencies:
            |
            | - Properties
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
            | Tenants depend on existing users.
            |
            | The tenant architecture uses:
            |
            | users
            |    ↓
            | tenants
            |
            | Authentication/account information remains in the users table,
            | while tenant-specific profile information is stored in tenants.
            |
            */

            TenantSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 14. TENANCIES
            |--------------------------------------------------------------------------
            |
            | A tenancy connects a tenant to a property/unit for a defined
            | contractual occupancy period.
            |
            | Dependencies:
            |
            | - Tenants
            | - Properties
            | - Apartments
            | - Units
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
            | Architecture:
            |
            | Tenant
            |    └── Tenancy
            |          └── Lease
            |
            | Tenant, property, apartment and unit information is resolved
            | through the tenancy relationship and is not unnecessarily
            | duplicated in the leases table.
            |
            */

            LeaseSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 16. PAYMENTS
            |--------------------------------------------------------------------------
            |
            | Payments are the core financial records of the estate management
            | system.
            |
            | Payments depend on existing:
            |
            | - Users
            | - Tenants
            | - Tenancies
            | - Properties
            | - Apartments
            | - Units
            |
            | The PaymentSeeder creates different payment scenarios including:
            |
            | - Rent
            | - Security deposits
            | - Service charges
            | - Utilities
            | - Penalties
            | - Pending payments
            |
            | It also covers different payment methods such as:
            |
            | - M-Pesa
            | - Bank transfer
            | | - Cash
            | - Card
            |
            | The Payment model is responsible for generating:
            |
            | - Payment numbers
            | - Receipt numbers for completed payments
            |
            */

            PaymentSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 17. BOOKINGS
            |--------------------------------------------------------------------------
            |
            | Bookings depend on existing operational records.
            |
            | Dependencies may include:
            |
            | - Users
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
            | 18. MAINTENANCE
            |--------------------------------------------------------------------------
            |
            | Maintenance records depend on existing operational and user
            | records.
            |
            | Dependencies:
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