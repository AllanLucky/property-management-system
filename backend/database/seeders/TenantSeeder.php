<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | TENANT DATA
        |--------------------------------------------------------------------------
        */

        $tenants = [
            [
                'first_name' => 'Brian',
                'last_name' => 'Mwangi',
                'other_names' => 'Kamau',
                'email' => 'brian.mwangi@example.com',
                'phone' => '+254711000001',
                'date_of_birth' => '1992-04-15',
                'gender' => 'male',
                'id_number' => '28745001',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00100',
                'address' => 'Westlands, Nairobi',
                'occupation' => 'Software Engineer',
                'employer' => 'Tech Solutions Kenya',
                'monthly_income' => 185000,
                'emergency_contact_name' => 'Jane Mwangi',
                'emergency_contact_phone' => '+254722000001',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Long-term residential tenant with good payment history.',
            ],

            [
                'first_name' => 'Grace',
                'last_name' => 'Wanjiku',
                'other_names' => 'Njeri',
                'email' => 'grace.wanjiku@example.com',
                'phone' => '+254711000002',
                'date_of_birth' => '1990-08-21',
                'gender' => 'female',
                'id_number' => '29167002',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kiambu',
                'city' => 'Ruiru',
                'postal_code' => '00232',
                'address' => 'Ruiru, Kiambu',
                'occupation' => 'Accountant',
                'employer' => 'Nairobi Finance Group',
                'monthly_income' => 145000,
                'emergency_contact_name' => 'Peter Wanjiku',
                'emergency_contact_phone' => '+254722000002',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Active tenant occupying a two-bedroom apartment.',
            ],

            [
                'first_name' => 'David',
                'last_name' => 'Otieno',
                'other_names' => 'Ochieng',
                'email' => 'david.otieno@example.com',
                'phone' => '+254711000003',
                'date_of_birth' => '1988-02-10',
                'gender' => 'male',
                'id_number' => '24583003',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kisumu',
                'city' => 'Kisumu',
                'postal_code' => '40100',
                'address' => 'Milimani, Kisumu',
                'occupation' => 'Business Manager',
                'employer' => 'Lake Victoria Enterprises',
                'monthly_income' => 210000,
                'emergency_contact_name' => 'Susan Otieno',
                'emergency_contact_phone' => '+254722000003',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Verified tenant with stable employment.',
            ],

            [
                'first_name' => 'Mercy',
                'last_name' => 'Akinyi',
                'other_names' => 'Adhiambo',
                'email' => 'mercy.akinyi@example.com',
                'phone' => '+254711000004',
                'date_of_birth' => '1995-11-03',
                'gender' => 'female',
                'id_number' => '31894004',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00505',
                'address' => 'Kilimani, Nairobi',
                'occupation' => 'Marketing Executive',
                'employer' => 'Bright Media Africa',
                'monthly_income' => 125000,
                'emergency_contact_name' => 'Rose Akinyi',
                'emergency_contact_phone' => '+254722000004',
                'emergency_contact_relationship' => 'Mother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Current tenant with active tenancy.',
            ],

            [
                'first_name' => 'Samuel',
                'last_name' => 'Kiptoo',
                'other_names' => 'Kibet',
                'email' => 'samuel.kiptoo@example.com',
                'phone' => '+254711000005',
                'date_of_birth' => '1986-06-18',
                'gender' => 'male',
                'id_number' => '22356005',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Uasin Gishu',
                'city' => 'Eldoret',
                'postal_code' => '30100',
                'address' => 'Elgon View, Eldoret',
                'occupation' => 'Civil Engineer',
                'employer' => 'Build Kenya Contractors',
                'monthly_income' => 240000,
                'emergency_contact_name' => 'Lilian Kiptoo',
                'emergency_contact_phone' => '+254722000005',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Professional tenant with long-term rental requirements.',
            ],

            [
                'first_name' => 'Faith',
                'last_name' => 'Njeri',
                'other_names' => 'Wambui',
                'email' => 'faith.njeri@example.com',
                'phone' => '+254711000006',
                'date_of_birth' => '1997-01-26',
                'gender' => 'female',
                'id_number' => '32978006',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nakuru',
                'city' => 'Nakuru',
                'postal_code' => '20100',
                'address' => 'Milimani, Nakuru',
                'occupation' => 'Human Resources Officer',
                'employer' => 'People First Kenya',
                'monthly_income' => 115000,
                'emergency_contact_name' => 'Mary Njeri',
                'emergency_contact_phone' => '+254722000006',
                'emergency_contact_relationship' => 'Mother',
                'status' => Tenant::STATUS_PENDING,
                'is_active' => false,
                'notes' => 'Tenant application awaiting verification.',
            ],

            [
                'first_name' => 'Kevin',
                'last_name' => 'Kamau',
                'other_names' => 'Maina',
                'email' => 'kevin.kamau@example.com',
                'phone' => '+254711000007',
                'date_of_birth' => '1994-09-12',
                'gender' => 'male',
                'id_number' => '30245007',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00100',
                'address' => 'South B, Nairobi',
                'occupation' => 'Graphic Designer',
                'employer' => 'Creative Hub Africa',
                'monthly_income' => 98000,
                'emergency_contact_name' => 'James Kamau',
                'emergency_contact_phone' => '+254722000007',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Active tenant working in the creative industry.',
            ],

            [
                'first_name' => 'Lucy',
                'last_name' => 'Chebet',
                'other_names' => 'Jepchirchir',
                'email' => 'lucy.chebet@example.com',
                'phone' => '+254711000008',
                'date_of_birth' => '1991-03-29',
                'gender' => 'female',
                'id_number' => '27689008',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kericho',
                'city' => 'Kericho',
                'postal_code' => '20200',
                'address' => 'Kericho Town',
                'occupation' => 'Pharmacist',
                'employer' => 'CarePlus Pharmacy',
                'monthly_income' => 160000,
                'emergency_contact_name' => 'Daniel Chebet',
                'emergency_contact_phone' => '+254722000008',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Verified professional tenant.',
            ],

            [
                'first_name' => 'Joseph',
                'last_name' => 'Omondi',
                'other_names' => 'Odhiambo',
                'email' => 'joseph.omondi@example.com',
                'phone' => '+254711000009',
                'date_of_birth' => '1985-12-07',
                'gender' => 'male',
                'id_number' => '21876009',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00606',
                'address' => 'Lavington, Nairobi',
                'occupation' => 'Procurement Manager',
                'employer' => 'East Africa Supplies Ltd',
                'monthly_income' => 275000,
                'emergency_contact_name' => 'Ann Omondi',
                'emergency_contact_phone' => '+254722000009',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Premium property tenant.',
            ],

            [
                'first_name' => 'Anne',
                'last_name' => 'Wambui',
                'other_names' => 'Nyambura',
                'email' => 'anne.wambui@example.com',
                'phone' => '+254711000010',
                'date_of_birth' => '1993-07-14',
                'gender' => 'female',
                'id_number' => '29431010',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Murang’a',
                'city' => 'Thika',
                'postal_code' => '01000',
                'address' => 'Section 9, Thika',
                'occupation' => 'Teacher',
                'employer' => 'Green Valley Academy',
                'monthly_income' => 85000,
                'emergency_contact_name' => 'John Wambui',
                'emergency_contact_phone' => '+254722000010',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_INACTIVE,
                'is_active' => false,
                'notes' => 'Former tenant. Account currently inactive.',
            ],

            [
                'first_name' => 'Patrick',
                'last_name' => 'Mutua',
                'other_names' => 'Muli',
                'email' => 'patrick.mutua@example.com',
                'phone' => '+254711000011',
                'date_of_birth' => '1989-05-22',
                'gender' => 'male',
                'id_number' => '25892011',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Machakos',
                'city' => 'Machakos',
                'postal_code' => '90100',
                'address' => 'Machakos Town',
                'occupation' => 'Sales Manager',
                'employer' => 'East Africa Trading Co.',
                'monthly_income' => 135000,
                'emergency_contact_name' => 'Catherine Mutua',
                'emergency_contact_phone' => '+254722000011',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Active tenant with verified income.',
            ],

            [
                'first_name' => 'Esther',
                'last_name' => 'Atieno',
                'other_names' => 'Auma',
                'email' => 'esther.atieno@example.com',
                'phone' => '+254711000012',
                'date_of_birth' => '1996-10-30',
                'gender' => 'female',
                'id_number' => '32167012',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kisumu',
                'city' => 'Kisumu',
                'postal_code' => '40100',
                'address' => 'Kondele, Kisumu',
                'occupation' => 'Medical Officer',
                'employer' => 'Lakeview Medical Centre',
                'monthly_income' => 155000,
                'emergency_contact_name' => 'Michael Atieno',
                'emergency_contact_phone' => '+254722000012',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_PENDING,
                'is_active' => false,
                'notes' => 'New tenant application awaiting approval.',
            ],

            [
                'first_name' => 'Daniel',
                'last_name' => 'Kariuki',
                'other_names' => 'Karanja',
                'email' => 'daniel.kariuki@example.com',
                'phone' => '+254711000013',
                'date_of_birth' => '1987-11-19',
                'gender' => 'male',
                'id_number' => '23654013',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kiambu',
                'city' => 'Limuru',
                'postal_code' => '00217',
                'address' => 'Limuru Town',
                'occupation' => 'Business Consultant',
                'employer' => 'Independent Consultant',
                'monthly_income' => 225000,
                'emergency_contact_name' => 'Susan Kariuki',
                'emergency_contact_phone' => '+254722000013',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Long-term tenant with consistent rental payments.',
            ],

            [
                'first_name' => 'Mary',
                'last_name' => 'Njoki',
                'other_names' => 'Wairimu',
                'email' => 'mary.njoki@example.com',
                'phone' => '+254711000014',
                'date_of_birth' => '1998-02-17',
                'gender' => 'female',
                'id_number' => '33542014',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00100',
                'address' => 'Kasarani, Nairobi',
                'occupation' => 'Customer Service Officer',
                'employer' => 'Customer Care Kenya',
                'monthly_income' => 75000,
                'emergency_contact_name' => 'Jane Njoki',
                'emergency_contact_phone' => '+254722000014',
                'emergency_contact_relationship' => 'Mother',
                'status' => Tenant::STATUS_INACTIVE,
                'is_active' => false,
                'notes' => 'Former tenant whose account has been deactivated.',
            ],

            [
                'first_name' => 'George',
                'last_name' => 'Mugendi',
                'other_names' => 'Muriuki',
                'email' => 'george.mugendi@example.com',
                'phone' => '+254711000015',
                'date_of_birth' => '1984-08-05',
                'gender' => 'male',
                'id_number' => '20578015',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nyeri',
                'city' => 'Nyeri',
                'postal_code' => '10100',
                'address' => 'Nyeri Town',
                'occupation' => 'Architect',
                'employer' => 'Urban Design Associates',
                'monthly_income' => 260000,
                'emergency_contact_name' => 'Lucy Mugendi',
                'emergency_contact_phone' => '+254722000015',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Professional tenant with verified employment.',
            ],

            [
                'first_name' => 'Irene',
                'last_name' => 'Naliaka',
                'other_names' => 'Wekesa',
                'email' => 'irene.naliaka@example.com',
                'phone' => '+254711000016',
                'date_of_birth' => '1994-12-11',
                'gender' => 'female',
                'id_number' => '30156016',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kakamega',
                'city' => 'Kakamega',
                'postal_code' => '50100',
                'address' => 'Kakamega Town',
                'occupation' => 'Project Coordinator',
                'employer' => 'Development Partners Kenya',
                'monthly_income' => 140000,
                'emergency_contact_name' => 'Brian Naliaka',
                'emergency_contact_phone' => '+254722000016',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Active tenant with complete verification details.',
            ],

            [
                'first_name' => 'Robert',
                'last_name' => 'Kilonzo',
                'other_names' => 'Musau',
                'email' => 'robert.kilonzo@example.com',
                'phone' => '+254711000017',
                'date_of_birth' => '1990-01-09',
                'gender' => 'male',
                'id_number' => '28123017',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Kitui',
                'city' => 'Kitui',
                'postal_code' => '90200',
                'address' => 'Kitui Town',
                'occupation' => 'IT Consultant',
                'employer' => 'Digital Systems Africa',
                'monthly_income' => 195000,
                'emergency_contact_name' => 'Martha Kilonzo',
                'emergency_contact_phone' => '+254722000017',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_BLACKLISTED,
                'is_active' => false,
                'notes' => 'Tenant account restricted due to unresolved tenancy issues.',
            ],

            [
                'first_name' => 'Susan',
                'last_name' => 'Chepkirui',
                'other_names' => 'Jepkoech',
                'email' => 'susan.chepkirui@example.com',
                'phone' => '+254711000018',
                'date_of_birth' => '1992-06-25',
                'gender' => 'female',
                'id_number' => '28876018',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Bomet',
                'city' => 'Bomet',
                'postal_code' => '20400',
                'address' => 'Bomet Town',
                'occupation' => 'Banking Officer',
                'employer' => 'Kenya Commercial Finance',
                'monthly_income' => 175000,
                'emergency_contact_name' => 'Paul Chepkirui',
                'emergency_contact_phone' => '+254722000018',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Verified tenant with stable employment.',
            ],

            [
                'first_name' => 'Andrew',
                'last_name' => 'Were',
                'other_names' => 'Wanyonyi',
                'email' => 'andrew.were@example.com',
                'phone' => '+254711000019',
                'date_of_birth' => '1989-09-16',
                'gender' => 'male',
                'id_number' => '26431019',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Bungoma',
                'city' => 'Bungoma',
                'postal_code' => '50200',
                'address' => 'Bungoma Town',
                'occupation' => 'Operations Manager',
                'employer' => 'Logistics Kenya Ltd',
                'monthly_income' => 165000,
                'emergency_contact_name' => 'Elizabeth Were',
                'emergency_contact_phone' => '+254722000019',
                'emergency_contact_relationship' => 'Spouse',
                'status' => Tenant::STATUS_ACTIVE,
                'is_active' => true,
                'notes' => 'Active tenant with good rental history.',
            ],

            [
                'first_name' => 'Catherine',
                'last_name' => 'Muthoni',
                'other_names' => 'Wanjiru',
                'email' => 'catherine.muthoni@example.com',
                'phone' => '+254711000020',
                'date_of_birth' => '1995-04-08',
                'gender' => 'female',
                'id_number' => '31456020',
                'passport_number' => null,
                'country' => 'Kenya',
                'county' => 'Nairobi',
                'city' => 'Nairobi',
                'postal_code' => '00200',
                'address' => 'Kileleshwa, Nairobi',
                'occupation' => 'Business Analyst',
                'employer' => 'East Africa Consulting',
                'monthly_income' => 180000,
                'emergency_contact_name' => 'David Muthoni',
                'emergency_contact_phone' => '+254722000020',
                'emergency_contact_relationship' => 'Brother',
                'status' => Tenant::STATUS_PENDING,
                'is_active' => false,
                'notes' => 'New tenant awaiting verification and approval.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE TENANTS
        |--------------------------------------------------------------------------
        */

        foreach ($tenants as $index => $tenantData) {
            Tenant::create([
                'tenant_number' =>
                    'TNT-' .
                    strtoupper(
                        Str::random(8)
                    ),

                'first_name' =>
                    $tenantData['first_name'],

                'last_name' =>
                    $tenantData['last_name'],

                'other_names' =>
                    $tenantData['other_names'],

                'email' =>
                    $tenantData['email'],

                'phone' =>
                    $tenantData['phone'],

                'date_of_birth' =>
                    Carbon::parse(
                        $tenantData['date_of_birth']
                    ),

                'gender' =>
                    $tenantData['gender'],

                'id_number' =>
                    $tenantData['id_number'],

                'passport_number' =>
                    $tenantData['passport_number'],

                'country' =>
                    $tenantData['country'],

                'county' =>
                    $tenantData['county'],

                'city' =>
                    $tenantData['city'],

                'postal_code' =>
                    $tenantData['postal_code'],

                'address' =>
                    $tenantData['address'],

                'occupation' =>
                    $tenantData['occupation'],

                'employer' =>
                    $tenantData['employer'],

                'monthly_income' =>
                    $tenantData['monthly_income'],

                'emergency_contact_name' =>
                    $tenantData['emergency_contact_name'],

                'emergency_contact_phone' =>
                    $tenantData['emergency_contact_phone'],

                'emergency_contact_relationship' =>
                    $tenantData['emergency_contact_relationship'],

                /*
                |--------------------------------------------------------------------------
                | Documents
                |--------------------------------------------------------------------------
                */

                'photo' => null,
                'photo_public_id' => null,

                'id_front' => null,
                'id_front_public_id' => null,

                'id_back' => null,
                'id_back_public_id' => null,

                /*
                |--------------------------------------------------------------------------
                | Status
                |--------------------------------------------------------------------------
                */

                'status' =>
                    $tenantData['status'],

                'is_active' =>
                    $tenantData['is_active'],

                /*
                |--------------------------------------------------------------------------
                | Notes
                |--------------------------------------------------------------------------
                */

                'notes' =>
                    $tenantData['notes'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($tenants) .
            ' tenants seeded successfully.'
        );
    }
}

