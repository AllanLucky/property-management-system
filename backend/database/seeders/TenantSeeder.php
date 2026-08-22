<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
          $tenants = [
            [
                'tenant_number' => 'TNT-000001',
                'first_name' => 'Brian',
                'last_name' => 'Mwangi',
                'other_names' => 'Kamau',
                'email' => 'brian.mwangi@example.com',
                'phone' => '+254711000001',
                'date_of_birth' => '1992-04-15',
                'gender' => 'male',
                'id_number' => '28745001',
                'passport_number' => 'A12345678',
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
                'is_verified' => true,
                'verified_at' => '2026-08-01 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Long-term residential tenant with good payment history.',
            ],

            [
                'tenant_number' => 'TNT-000002',
                'first_name' => 'Grace',
                'last_name' => 'Wanjiku',
                'other_names' => 'Njeri',
                'email' => 'grace.wanjiku@example.com',
                'phone' => '+254711000002',
                'date_of_birth' => '1990-08-21',
                'gender' => 'female',
                'id_number' => '29167002',
                'passport_number' => 'A23456789',
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
                'is_verified' => true,
                'verified_at' => '2026-08-02 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Active tenant occupying a two-bedroom apartment.',
            ],

            [
                'tenant_number' => 'TNT-000003',
                'first_name' => 'David',
                'last_name' => 'Otieno',
                'other_names' => 'Ochieng',
                'email' => 'david.otieno@example.com',
                'phone' => '+254711000003',
                'date_of_birth' => '1988-02-10',
                'gender' => 'male',
                'id_number' => '24583003',
                'passport_number' => 'A34567890',
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
                'is_verified' => true,
                'verified_at' => '2026-08-03 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Verified tenant with stable employment.',
            ],

            [
                'tenant_number' => 'TNT-000004',
                'first_name' => 'Mercy',
                'last_name' => 'Akinyi',
                'other_names' => 'Adhiambo',
                'email' => 'mercy.akinyi@example.com',
                'phone' => '+254711000004',
                'date_of_birth' => '1995-11-03',
                'gender' => 'female',
                'id_number' => '31894004',
                'passport_number' => 'A45678901',
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
                'is_verified' => true,
                'verified_at' => '2026-08-04 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Current tenant with active tenancy.',
            ],

            [
                'tenant_number' => 'TNT-000005',
                'first_name' => 'Samuel',
                'last_name' => 'Kiptoo',
                'other_names' => 'Kibet',
                'email' => 'samuel.kiptoo@example.com',
                'phone' => '+254711000005',
                'date_of_birth' => '1986-06-18',
                'gender' => 'male',
                'id_number' => '22356005',
                'passport_number' => 'A56789012',
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
                'is_verified' => true,
                'verified_at' => '2026-08-05 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Professional tenant with long-term rental requirements.',
            ],

            [
                'tenant_number' => 'TNT-000006',
                'first_name' => 'Faith',
                'last_name' => 'Njeri',
                'other_names' => 'Wambui',
                'email' => 'faith.njeri@example.com',
                'phone' => '+254711000006',
                'date_of_birth' => '1997-01-26',
                'gender' => 'female',
                'id_number' => '32978006',
                'passport_number' => 'A67890123',
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
                'is_verified' => false,
                'verified_at' => null,
                'status' => Tenant::STATUS_PENDING,
                'notes' => 'Tenant application awaiting verification.',
            ],

            [
                'tenant_number' => 'TNT-000007',
                'first_name' => 'Kevin',
                'last_name' => 'Kamau',
                'other_names' => 'Maina',
                'email' => 'kevin.kamau@example.com',
                'phone' => '+254711000007',
                'date_of_birth' => '1994-09-12',
                'gender' => 'male',
                'id_number' => '30245007',
                'passport_number' => 'A78901234',
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
                'is_verified' => true,
                'verified_at' => '2026-08-06 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Active tenant working in the creative industry.',
            ],

            [
                'tenant_number' => 'TNT-000008',
                'first_name' => 'Lucy',
                'last_name' => 'Chebet',
                'other_names' => 'Jepchirchir',
                'email' => 'lucy.chebet@example.com',
                'phone' => '+254711000008',
                'date_of_birth' => '1991-03-29',
                'gender' => 'female',
                'id_number' => '27689008',
                'passport_number' => 'A89012345',
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
                'is_verified' => true,
                'verified_at' => '2026-08-07 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Verified professional tenant.',
            ],

            [
                'tenant_number' => 'TNT-000009',
                'first_name' => 'Joseph',
                'last_name' => 'Omondi',
                'other_names' => 'Odhiambo',
                'email' => 'joseph.omondi@example.com',
                'phone' => '+254711000009',
                'date_of_birth' => '1985-12-07',
                'gender' => 'male',
                'id_number' => '21876009',
                'passport_number' => 'A90123456',
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
                'is_verified' => true,
                'verified_at' => '2026-08-08 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Premium property tenant.',
            ],

            [
                'tenant_number' => 'TNT-000010',
                'first_name' => 'Anne',
                'last_name' => 'Wambui',
                'other_names' => 'Nyambura',
                'email' => 'anne.wambui@example.com',
                'phone' => '+254711000010',
                'date_of_birth' => '1993-07-14',
                'gender' => 'female',
                'id_number' => '29431010',
                'passport_number' => 'B12345678',
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
                'is_verified' => true,
                'verified_at' => '2026-07-01 07:00:00',
                'status' => Tenant::STATUS_INACTIVE,
                'notes' => 'Former tenant. Account currently inactive.',
            ],

            [
                'tenant_number' => 'TNT-000011',
                'first_name' => 'Patrick',
                'last_name' => 'Mutua',
                'other_names' => 'Muli',
                'email' => 'patrick.mutua@example.com',
                'phone' => '+254711000011',
                'date_of_birth' => '1989-05-22',
                'gender' => 'male',
                'id_number' => '25892011',
                'passport_number' => 'B23456789',
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
                'is_verified' => true,
                'verified_at' => '2026-08-09 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Active tenant with verified income.',
            ],

            [
                'tenant_number' => 'TNT-000012',
                'first_name' => 'Esther',
                'last_name' => 'Atieno',
                'other_names' => 'Auma',
                'email' => 'esther.atieno@example.com',
                'phone' => '+254711000012',
                'date_of_birth' => '1996-10-30',
                'gender' => 'female',
                'id_number' => '32167012',
                'passport_number' => 'B34567890',
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
                'is_verified' => false,
                'verified_at' => null,
                'status' => Tenant::STATUS_PENDING,
                'notes' => 'New tenant application awaiting approval.',
            ],

            [
                'tenant_number' => 'TNT-000013',
                'first_name' => 'Daniel',
                'last_name' => 'Kariuki',
                'other_names' => 'Karanja',
                'email' => 'daniel.kariuki@example.com',
                'phone' => '+254711000013',
                'date_of_birth' => '1987-11-19',
                'gender' => 'male',
                'id_number' => '23654013',
                'passport_number' => 'B45678901',
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
                'is_verified' => true,
                'verified_at' => '2026-08-10 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Long-term tenant with consistent rental payments.',
            ],

            [
                'tenant_number' => 'TNT-000014',
                'first_name' => 'Mary',
                'last_name' => 'Njoki',
                'other_names' => 'Wairimu',
                'email' => 'mary.njoki@example.com',
                'phone' => '+254711000014',
                'date_of_birth' => '1998-02-17',
                'gender' => 'female',
                'id_number' => '33542014',
                'passport_number' => 'B56789012',
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
                'is_verified' => true,
                'verified_at' => '2026-06-15 07:00:00',
                'status' => Tenant::STATUS_INACTIVE,
                'notes' => 'Former tenant whose account has been deactivated.',
            ],

            [
                'tenant_number' => 'TNT-000015',
                'first_name' => 'George',
                'last_name' => 'Mugendi',
                'other_names' => 'Muriuki',
                'email' => 'george.mugendi@example.com',
                'phone' => '+254711000015',
                'date_of_birth' => '1984-08-05',
                'gender' => 'male',
                'id_number' => '20578015',
                'passport_number' => 'B67890123',
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
                'is_verified' => true,
                'verified_at' => '2026-08-11 07:00:00',
                'status' => Tenant::STATUS_ACTIVE,
                'notes' => 'Professional tenant with verified employment.',
            ],
        ];

        foreach ($tenants as $data) {
            /*
            |--------------------------------------------------------------------------
            | Auto-compute is_active based on status
            |--------------------------------------------------------------------------
            */
            $data['is_active'] = $data['status'] === Tenant::STATUS_ACTIVE;

            /*
            |--------------------------------------------------------------------------
            | Find Existing User
            |--------------------------------------------------------------------------
            */
            $user = User::withTrashed()
                ->where('email', $data['email'])
                ->first();

            if ($user) {
                if (method_exists($user, 'trashed') && $user->trashed()) {
                    $user->restore();
                }

                $user->update([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'phone' => $data['phone'],
                ]);
            } else {
                $user = User::create([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'password' => Hash::make('Password@123'),
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Assign Tenant Role
            |--------------------------------------------------------------------------
            */
            if (
                method_exists($user, 'assignRole') &&
                \Spatie\Permission\Models\Role::where('name', 'tenant')->exists()
            ) {
                $user->assignRole('tenant');
            }

            /*
            |--------------------------------------------------------------------------
            | Create / Update Tenant
            |--------------------------------------------------------------------------
            */
            Tenant::withTrashed()->updateOrCreate(
                ['tenant_number' => $data['tenant_number']],
                array_merge($data, ['user_id' => $user->id])
            );
        }

        $this->command?->info(count($tenants) . ' tenants and their user accounts seeded successfully.');
        $this->command?->info('Tenant login password: Password@123');
    }
}
