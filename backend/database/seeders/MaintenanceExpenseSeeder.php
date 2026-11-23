<?php

namespace Database\Seeders;

use App\Models\MaintenanceRequest;
use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceExpense;
use App\Models\User;
use Illuminate\Database\Seeder;

class MaintenanceExpenseSeeder extends Seeder
{
    /**
     * Seed sample maintenance expenses.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | LOAD EXISTING RECORDS
        |--------------------------------------------------------------------------
        */

        $requests = MaintenanceRequest::with('assignments')
            ->orderBy('id')
            ->get();

        $users = User::pluck('id')->toArray();

        if ($requests->isEmpty()) {
            $this->command->warn(
                'No maintenance requests found. Run MaintenanceRequestSeeder first.'
            );

            return;
        }

        if (empty($users)) {
            $this->command->warn(
                'No users found. Run UsersSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | EXPENSE EXAMPLES
        |--------------------------------------------------------------------------
        */

        $expenses = [
            [
                'category' => 'materials',
                'description' => 'Purchase of plumbing pipes and fittings',
                'quantity' => 2,
                'unit_cost' => 1500,
                'supplier_name' => 'Nairobi Building Supplies',
                'supplier_contact' => '+254700000001',
                'status' => 'approved',
                'payment_status' => 'paid',
                'payment_ratio' => 1,
            ],
            [
                'category' => 'labour',
                'description' => 'Technician labour charges',
                'quantity' => 1,
                'unit_cost' => 3500,
                'supplier_name' => 'Maintenance Technician',
                'supplier_contact' => '+254700000002',
                'status' => 'approved',
                'payment_status' => 'partially_paid',
                'payment_ratio' => 0.5,
            ],
            [
                'category' => 'spare_parts',
                'description' => 'Replacement electrical components',
                'quantity' => 3,
                'unit_cost' => 850,
                'supplier_name' => 'Electrical Solutions Ltd',
                'supplier_contact' => '+254700000003',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_ratio' => 0,
            ],
            [
                'category' => 'transport',
                'description' => 'Transportation of maintenance materials',
                'quantity' => 1,
                'unit_cost' => 1200,
                'supplier_name' => 'Local Transport Services',
                'supplier_contact' => '+254700000004',
                'status' => 'approved',
                'payment_status' => 'paid',
                'payment_ratio' => 1,
            ],
            [
                'category' => 'equipment',
                'description' => 'Equipment rental for repair work',
                'quantity' => 2,
                'unit_cost' => 2000,
                'supplier_name' => 'Equipment Rental Services',
                'supplier_contact' => '+254700000005',
                'status' => 'rejected',
                'payment_status' => 'unpaid',
                'payment_ratio' => 0,
            ],
            [
                'category' => 'service',
                'description' => 'Professional inspection service',
                'quantity' => 1,
                'unit_cost' => 4500,
                'supplier_name' => 'Property Inspection Services',
                'supplier_contact' => '+254700000006',
                'status' => 'approved',
                'payment_status' => 'paid',
                'payment_ratio' => 1,
            ],
            [
                'category' => 'other',
                'description' => 'Additional maintenance expenses',
                'quantity' => 1,
                'unit_cost' => 750,
                'supplier_name' => 'General Supplier',
                'supplier_contact' => '+254700000007',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_ratio' => 0,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE EXPENSE RECORDS
        |--------------------------------------------------------------------------
        */

        foreach ($requests as $index => $request) {

            $expense = $expenses[$index % count($expenses)];

            $quantity = $expense['quantity'];
            $unitCost = $expense['unit_cost'];

            $amount = round($quantity * $unitCost, 2);

            $status = $expense['status'];
            $paymentStatus = $expense['payment_status'];

            $paidAmount = round(
                $amount * $expense['payment_ratio'],
                2
            );

            /*
            |--------------------------------------------------------------------------
            | FIND AN ASSIGNMENT FOR THIS REQUEST
            |--------------------------------------------------------------------------
            */

            $assignment = MaintenanceAssignment::where(
                'maintenance_request_id',
                $request->id
            )->first();

            /*
            |--------------------------------------------------------------------------
            | APPROVAL AND PAYMENT DATES
            |--------------------------------------------------------------------------
            */

            $expenseDate = now()
                ->subDays(($index + 1) * 2)
                ->toDateString();

            $approvedAt = $status === 'approved'
                ? now()->subDays($index + 1)
                : null;

            $rejectedAt = $status === 'rejected'
                ? now()->subDays($index + 1)
                : null;

            $paidAt = $paidAmount > 0
                ? now()->subDays($index)
                : null;

            /*
            |--------------------------------------------------------------------------
            | CREATE OR UPDATE EXPENSE
            |--------------------------------------------------------------------------
            */

            MaintenanceExpense::updateOrCreate(
                [
                    'maintenance_request_id' => $request->id,
                    'description' => $expense['description'],
                ],
                [
                    'maintenance_assignment_id' => $assignment?->id,

                    'submitted_by' => $users[$index % count($users)],

                    'approved_by' => $status === 'approved'
                        ? $users[($index + 1) % count($users)]
                        : null,

                    'category' => $expense['category'],

                    'description' => $expense['description'],

                    'quantity' => $quantity,

                    'unit_cost' => $unitCost,

                    'amount' => $amount,

                    'currency' => 'KES',

                    'expense_date' => $expenseDate,

                    'receipt_number' => sprintf(
                        'MEX-%s-%04d',
                        now()->format('Ymd'),
                        $index + 1
                    ),

                    // Sample metadata only; no physical receipt is uploaded.
                    'receipt_path' => null,

                    'supplier_name' => $expense['supplier_name'],

                    'supplier_contact' => $expense['supplier_contact'],

                    'status' => $status,

                    'approved_at' => $approvedAt,

                    'rejected_at' => $rejectedAt,

                    'rejection_reason' => $status === 'rejected'
                        ? 'The submitted expense requires further verification.'
                        : null,

                    'payment_status' => $paymentStatus,

                    'paid_amount' => $paidAmount,

                    'paid_at' => $paidAt,

                    'payment_reference' => $paidAmount > 0
                        ? sprintf('PAY-MEX-%04d', $index + 1)
                        : null,

                    'notes' => 'Sample maintenance expense record.',
                ]
            );
        }

        $this->command->info(
            'Maintenance expenses seeded successfully.'
        );

        $this->command->info(
            'Total maintenance requests processed: ' . $requests->count()
        );
    }
}
