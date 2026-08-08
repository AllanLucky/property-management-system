<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Unit;
use App\Models\Tenant;
use App\Models\Apartment;
use App\Models\Property;
use App\Models\Maintenance;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class MaintenanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Fetch existing records
        |--------------------------------------------------------------------------
        */

        $properties = Property::query()
            ->get();

        $apartments = Apartment::query()
            ->with('property')
            ->get();

        $units = Unit::query()
            ->with([
                'property',
                'apartment',
            ])
            ->get();

        $tenants = Tenant::query()
            ->get();

        $users = User::query()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Stop if required data does not exist
        |--------------------------------------------------------------------------
        */

        if ($properties->isEmpty()) {
            $this->command->warn(
                'No properties found. Please run the property seeder first.'
            );

            return;
        }

        if ($users->isEmpty()) {
            $this->command->warn(
                'No users found. Please run the user seeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Possible maintenance data
        |--------------------------------------------------------------------------
        */

        $maintenanceRequests = [
            [
                'title' => 'Leaking Kitchen Sink',
                'description' => 'The kitchen sink is leaking underneath the cabinet and requires plumbing inspection and repair.',
                'type' => Maintenance::TYPE_PLUMBING,
                'priority' => Maintenance::PRIORITY_MEDIUM,
                'status' => Maintenance::STATUS_PENDING,
                'location' => 'Kitchen',
                'estimated_cost' => 3500,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Flexible pipe, washers and plumbing sealant.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Faulty Bedroom Light',
                'description' => 'The main ceiling light in the bedroom is not working and needs electrical inspection.',
                'type' => Maintenance::TYPE_ELECTRICAL,
                'priority' => Maintenance::PRIORITY_HIGH,
                'status' => Maintenance::STATUS_ASSIGNED,
                'location' => 'Master Bedroom',
                'estimated_cost' => 2500,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'LED bulb and electrical connector.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Air Conditioner Not Cooling',
                'description' => 'The air conditioning unit is running but is not producing sufficient cold air.',
                'type' => Maintenance::TYPE_HVAC,
                'priority' => Maintenance::PRIORITY_HIGH,
                'status' => Maintenance::STATUS_IN_PROGRESS,
                'location' => 'Living Room',
                'estimated_cost' => 8500,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Refrigerant gas and replacement air filter.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Blocked Bathroom Drain',
                'description' => 'The bathroom drainage system is blocked and water is draining very slowly.',
                'type' => Maintenance::TYPE_PLUMBING,
                'priority' => Maintenance::PRIORITY_URGENT,
                'status' => Maintenance::STATUS_COMPLETED,
                'location' => 'Bathroom',
                'estimated_cost' => 4000,
                'actual_cost' => 3800,
                'requires_parts' => false,
                'parts_description' => null,
                'is_emergency' => true,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Broken Door Lock',
                'description' => 'The main entrance door lock is damaged and needs to be replaced.',
                'type' => Maintenance::TYPE_SECURITY,
                'priority' => Maintenance::PRIORITY_URGENT,
                'status' => Maintenance::STATUS_COMPLETED,
                'location' => 'Main Entrance',
                'estimated_cost' => 5500,
                'actual_cost' => 5200,
                'requires_parts' => true,
                'parts_description' => 'Heavy-duty security door lock.',
                'is_emergency' => true,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Wall Paint Damage',
                'description' => 'The interior wall paint is damaged and requires patching and repainting.',
                'type' => Maintenance::TYPE_PAINTING,
                'priority' => Maintenance::PRIORITY_LOW,
                'status' => Maintenance::STATUS_PENDING,
                'location' => 'Living Room',
                'estimated_cost' => 6000,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Interior paint, primer and filler.',
                'is_emergency' => false,
                'is_tenant_responsibility' => true,
            ],

            [
                'title' => 'Water Heater Failure',
                'description' => 'The water heater is not heating water and requires technician inspection.',
                'type' => Maintenance::TYPE_ELECTRICAL,
                'priority' => Maintenance::PRIORITY_CRITICAL,
                'status' => Maintenance::STATUS_ASSIGNED,
                'location' => 'Bathroom',
                'estimated_cost' => 12000,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Heating element and thermostat.',
                'is_emergency' => true,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Generator Inspection',
                'description' => 'The backup generator requires routine inspection and preventive maintenance.',
                'type' => Maintenance::TYPE_GENERAL,
                'priority' => Maintenance::PRIORITY_MEDIUM,
                'status' => Maintenance::STATUS_SCHEDULED ?? Maintenance::STATUS_PENDING,
                'location' => 'Generator Room',
                'estimated_cost' => 15000,
                'actual_cost' => null,
                'requires_parts' => false,
                'parts_description' => null,
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Broken Window Handle',
                'description' => 'The bedroom window handle is broken and needs replacement.',
                'type' => Maintenance::TYPE_STRUCTURAL,
                'priority' => Maintenance::PRIORITY_LOW,
                'status' => Maintenance::STATUS_COMPLETED,
                'location' => 'Bedroom',
                'estimated_cost' => 1800,
                'actual_cost' => 1500,
                'requires_parts' => true,
                'parts_description' => 'Replacement aluminium window handle.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Washing Machine Repair',
                'description' => 'The washing machine is making abnormal noise during operation.',
                'type' => Maintenance::TYPE_APPLIANCE,
                'priority' => Maintenance::PRIORITY_MEDIUM,
                'status' => Maintenance::STATUS_ON_HOLD,
                'location' => 'Laundry Area',
                'estimated_cost' => 7000,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Replacement bearing and drive belt.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Common Area Cleaning',
                'description' => 'Deep cleaning required in the apartment common areas.',
                'type' => Maintenance::TYPE_CLEANING,
                'priority' => Maintenance::PRIORITY_LOW,
                'status' => Maintenance::STATUS_ASSIGNED,
                'location' => 'Common Area',
                'estimated_cost' => 4500,
                'actual_cost' => null,
                'requires_parts' => false,
                'parts_description' => null,
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Roof Water Leakage',
                'description' => 'Water is leaking through the roof during heavy rainfall and requires urgent inspection.',
                'type' => Maintenance::TYPE_STRUCTURAL,
                'priority' => Maintenance::PRIORITY_CRITICAL,
                'status' => Maintenance::STATUS_IN_PROGRESS,
                'location' => 'Roof',
                'estimated_cost' => 25000,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Roofing sheets, waterproof sealant and flashing.',
                'is_emergency' => true,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Security Light Replacement',
                'description' => 'The security light outside the building is not working and requires replacement.',
                'type' => Maintenance::TYPE_SECURITY,
                'priority' => Maintenance::PRIORITY_HIGH,
                'status' => Maintenance::STATUS_PENDING,
                'location' => 'Parking Area',
                'estimated_cost' => 3500,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Outdoor LED security light.',
                'is_emergency' => false,
                'is_tenant_responsibility' => false,
            ],

            [
                'title' => 'Kitchen Cabinet Repair',
                'description' => 'One of the kitchen cabinet doors has become loose and needs repair.',
                'type' => Maintenance::TYPE_GENERAL,
                'priority' => Maintenance::PRIORITY_LOW,
                'status' => Maintenance::STATUS_REJECTED,
                'location' => 'Kitchen',
                'estimated_cost' => 1500,
                'actual_cost' => null,
                'requires_parts' => true,
                'parts_description' => 'Cabinet hinges and screws.',
                'is_emergency' => false,
                'is_tenant_responsibility' => true,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create maintenance records
        |--------------------------------------------------------------------------
        */

        foreach ($maintenanceRequests as $index => $request) {
            /*
            |--------------------------------------------------------------------------
            | Select property
            |--------------------------------------------------------------------------
            */

            $property = $properties[$index % $properties->count()];

            /*
            |--------------------------------------------------------------------------
            | Find apartment belonging to property
            |--------------------------------------------------------------------------
            */

            $propertyApartments = $apartments->where(
                'property_id',
                $property->id
            );

            $apartment = $propertyApartments->isNotEmpty()
                ? $propertyApartments->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | Find unit belonging to property/apartment
            |--------------------------------------------------------------------------
            */

            $propertyUnits = $units->where(
                'property_id',
                $property->id
            );

            if ($apartment) {
                $apartmentUnits = $propertyUnits->where(
                    'apartment_id',
                    $apartment->id
                );

                if ($apartmentUnits->isNotEmpty()) {
                    $unit = $apartmentUnits->random();
                } elseif ($propertyUnits->isNotEmpty()) {
                    $unit = $propertyUnits->random();
                } else {
                    $unit = null;
                }
            } else {
                $unit = $propertyUnits->isNotEmpty()
                    ? $propertyUnits->random()
                    : null;
            }

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            $tenant = $tenants->isNotEmpty()
                ? $tenants->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | Reporter
            |--------------------------------------------------------------------------
            */

            $reporter = $users->random();

            /*
            |--------------------------------------------------------------------------
            | Assignee
            |--------------------------------------------------------------------------
            */

            $assignee = null;

            if (
                in_array(
                    $request['status'],
                    [
                        Maintenance::STATUS_ASSIGNED,
                        Maintenance::STATUS_IN_PROGRESS,
                        Maintenance::STATUS_COMPLETED,
                        Maintenance::STATUS_ON_HOLD,
                    ],
                    true
                )
            ) {
                $assignee = $users->random();
            }

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            $reportedAt = Carbon::now()
                ->subDays(rand(1, 45))
                ->subHours(rand(1, 12));

            $scheduledAt = (clone $reportedAt)
                ->addDays(rand(1, 7));

            $startedAt = null;
            $completedAt = null;

            if (
                in_array(
                    $request['status'],
                    [
                        Maintenance::STATUS_IN_PROGRESS,
                        Maintenance::STATUS_COMPLETED,
                    ],
                    true
                )
            ) {
                $startedAt = (clone $scheduledAt)
                    ->addHours(rand(1, 24));
            }

            if ($request['status'] === Maintenance::STATUS_COMPLETED) {
                $completedAt = (clone $startedAt)
                    ->addDays(rand(1, 4));
            }

            /*
            |--------------------------------------------------------------------------
            | Resolution
            |--------------------------------------------------------------------------
            */

            $resolution = null;

            if ($request['status'] === Maintenance::STATUS_COMPLETED) {
                $resolution = match ($request['type']) {
                    Maintenance::TYPE_PLUMBING =>
                        'Plumbing issue inspected and repaired successfully.',

                    Maintenance::TYPE_ELECTRICAL =>
                        'Electrical fault repaired and system tested successfully.',

                    Maintenance::TYPE_SECURITY =>
                        'Security component replaced and tested successfully.',

                    Maintenance::TYPE_STRUCTURAL =>
                        'Structural maintenance completed and area inspected.',

                    default =>
                        'Maintenance work completed successfully.',
                };
            }

            /*
            |--------------------------------------------------------------------------
            | Technician notes
            |--------------------------------------------------------------------------
            */

            $technicianNotes = $assignee
                ? 'Technician assigned for inspection and corrective maintenance.'
                : null;

            /*
            |--------------------------------------------------------------------------
            | Internal notes
            |--------------------------------------------------------------------------
            */

            $internalNotes = $request['is_emergency']
                ? 'Emergency maintenance request. Prioritize response and resolution.'
                : 'Standard maintenance request recorded in the estate management system.';

            /*
            |--------------------------------------------------------------------------
            | Create
            |--------------------------------------------------------------------------
            */

            Maintenance::create([
                'property_id' => $property->id,

                'apartment_id' => $apartment?->id,

                'unit_id' => $unit?->id,

                'tenant_id' => $tenant?->id,

                'reported_by' => $reporter->id,

                'assigned_to' => $assignee?->id,

                'title' => $request['title'],

                'slug' => Str::slug(
                    $request['title'] . '-' . ($unit?->id ?? $property->id) . '-' . ($index + 1)
                ),

                'description' => $request['description'],

                'type' => $request['type'],

                'priority' => $request['priority'],

                'status' => $request['status'],

                'location' => $request['location'],

                'images' => [],

                'reported_at' => $reportedAt,

                'scheduled_at' => $scheduledAt,

                'started_at' => $startedAt,

                'completed_at' => $completedAt,

                'estimated_cost' => $request['estimated_cost'],

                'actual_cost' => $request['actual_cost'],

                'resolution' => $resolution,

                'technician_notes' => $technicianNotes,

                'internal_notes' => $internalNotes,

                'requires_parts' => $request['requires_parts'],

                'parts_description' => $request['parts_description'],

                'is_emergency' => $request['is_emergency'],

                'is_tenant_responsibility' =>
                    $request['is_tenant_responsibility'],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Output
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($maintenanceRequests) .
            ' maintenance records seeded successfully.'
        );
    }
}