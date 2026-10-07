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
     * Plots
     *        ↓
     * Plot Sales
     *        ↓
     * Plot Payments
     *        ↓
     * Bookings
     *        ↓
     * Maintenance
     *
     * The order is important because operational, financial and transactional
     * records depend on records created earlier in the chain.
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
            | Countries, regions, counties, cities, areas and other location
            | records must exist before properties and plots are created.
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
            | 16. PROPERTY PAYMENTS
            |--------------------------------------------------------------------------
            |
            | Payments are the core financial records of the estate management
            | system.
            |
            | Payment records depend on existing:
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
            | - Cash
            | - Card
            |
            */

            PaymentSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 17. PLOTS
            |--------------------------------------------------------------------------
            |
            | Plots represent land parcels that can be marketed and sold
            | independently from rental properties, apartments and units.
            |
            | A plot may optionally belong to an existing property record but
            | remains a separate land asset in the plot module.
            |
            | Dependencies:
            |
            | - Locations
            | - Users are not required directly
            | - Properties are optional
            |
            */

            PlotSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 18. PLOT SALES
            |--------------------------------------------------------------------------
            |
            | Plot sales represent the actual sale transaction/contract between
            | a plot and a buyer.
            |
            | Dependencies:
            |
            | - Plots
            | - Users
            | - Agents (optional)
            |
            | Architecture:
            |
            | Plot
            |   ↓
            | PlotSale
            |
            | The buyer is an existing User record and does not require a
            | separate buyer table.
            |
            */

            PlotSaleSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 19. PLOT PAYMENTS
            |--------------------------------------------------------------------------
            |
            | Plot payments represent individual payments made against a
            | specific plot sale.
            |
            | Dependencies:
            |
            | - Plot Sales
            | - Buyers/users through the sale relationship
            |
            | Architecture:
            |
            | Plot
            |   ↓
            | PlotSale
            |   ↓
            | PlotPayment
            |
            | Payment records may represent:
            |
            | - Deposits
            | - Installments
            | - Balance payments
            | - Other plot-sale payments
            |
            | The PlotPayment model updates the related PlotSale amount paid
            | and outstanding balance when completed payments are created,
            | updated or deleted.
            |
            */

            PlotPaymentSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 20. BOOKINGS
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
            | Plot sales remain separate from normal property bookings.
            |
            */

            BookingSeeder::class,


            /*
            |--------------------------------------------------------------------------
            | 21. MAINTENANCE
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