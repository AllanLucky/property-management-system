<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([

            /*
            |--------------------------------------------------------------------------
            | 1. ROLES & PERMISSIONS
            |--------------------------------------------------------------------------
            |
            | Create roles and permissions before users so that users can
            | safely receive their assigned roles and permissions.
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
            | - Property reviews
            | - Property visits
            | - Property favorites
            | - Bookings
            | - Maintenance
            |
            */

            UsersSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 3. LOCATION DATA
            |--------------------------------------------------------------------------
            |
            | Countries, counties, cities and areas must exist before
            | properties are created.
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
            | Reviews depend on users and properties.
            |
            */

            PropertyReviewsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 8. PROPERTY VISITS
            |--------------------------------------------------------------------------
            |
            | Visits depend on users and properties.
            |
            */

            PropertyVisitsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 9. PROPERTY FAVORITES
            |--------------------------------------------------------------------------
            |
            | Favorites depend on users and properties.
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
            | Units depend on properties and apartments.
            |
            */

            UnitsSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 13. TENANTS
            |--------------------------------------------------------------------------
            |
            | Tenancies, bookings and maintenance records depend on tenants.
            |
            */

            TenantSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 14. TENANCIES
            |--------------------------------------------------------------------------
            |
            | Tenancies depend on:
            | - Properties
            | - Apartments
            | - Units
            | - Tenants
            |
            */

            TenancySeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 15. BOOKINGS
            |--------------------------------------------------------------------------
            |
            | Bookings depend on:
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
            | 16. MAINTENANCE
            |--------------------------------------------------------------------------
            |
            | Maintenance records depend on:
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
