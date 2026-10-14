<?php

namespace Database\Seeders;

use App\Models\PlotPayment;
use App\Models\PlotSale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlotPaymentSeeder extends Seeder
{
    /**
     * Seed plot payments.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | LOAD PLOT SALES WITH BUYERS
        |--------------------------------------------------------------------------
        */

        $saleNumbers = collect(range(1, 8))
            ->map(fn (int $number) => sprintf(
                'PS-20261005-%06d',
                $number
            ))
            ->all();

        $sales = PlotSale::query()
            ->with('buyer')
            ->whereIn('sale_number', $saleNumbers)
            ->get()
            ->keyBy('sale_number');

        if ($sales->isEmpty()) {
            $this->command?->warn(
                'PlotPaymentSeeder skipped: no plot sales were found.'
            );

            $this->command?->warn(
                'Run PlotSaleSeeder before PlotPaymentSeeder.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT DATA
        |--------------------------------------------------------------------------
        */

        $payments = [
            [
                'sale_number' => 'PS-20261005-000001',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000001',
                        'receipt_number' => 'RCP-20261005-000001',
                        'transaction_reference' => 'MPESA-PLT-000001',
                        'amount' => 500000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subDays(7),
                        'notes' => 'Initial deposit paid for the Ruiru plot purchase.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000002',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000002',
                        'receipt_number' => 'RCP-20261005-000002',
                        'transaction_reference' => 'MPESA-PLT-000002',
                        'amount' => 500000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subDays(5),
                        'notes' => 'Initial deposit paid for the Kitengela plot purchase.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000003',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000003',
                        'receipt_number' => 'RCP-20261005-000003',
                        'transaction_reference' => 'MPESA-PLT-000003',
                        'amount' => 500000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subDays(14),
                        'notes' => 'Initial plot reservation deposit paid through M-Pesa.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000004',
                        'receipt_number' => 'RCP-20261005-000004',
                        'transaction_reference' => 'BANK-PLT-000004',
                        'amount' => 500000,
                        'payment_type' => 'installment',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subDays(5),
                        'notes' => 'First monthly installment for the reserved Syokimau plot.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000004',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000005',
                        'receipt_number' => 'RCP-20261005-000005',
                        'transaction_reference' => 'BANK-PLT-000005',
                        'amount' => 2000000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subMonths(3),
                        'notes' => 'Initial deposit for the Juja commercial plot.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000006',
                        'receipt_number' => 'RCP-20261005-000006',
                        'transaction_reference' => 'MPESA-PLT-000006',
                        'amount' => 3000000,
                        'payment_type' => 'installment',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subMonths(2)->addDays(10),
                        'notes' => 'Second payment toward the Juja commercial plot.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000007',
                        'receipt_number' => 'RCP-20261005-000007',
                        'transaction_reference' => 'BANK-PLT-000007',
                        'amount' => 3000000,
                        'payment_type' => 'balance',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subMonths(2),
                        'notes' => 'Final settlement payment for the Juja plot sale.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000005',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000008',
                        'receipt_number' => 'RCP-20261005-000008',
                        'transaction_reference' => 'MPESA-PLT-000008',
                        'amount' => 400000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subDays(3),
                        'notes' => 'Initial deposit for the Ngong residential plot.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000006',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000009',
                        'receipt_number' => 'RCP-20261005-000009',
                        'transaction_reference' => 'BANK-PLT-000009',
                        'amount' => 1500000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subDays(14),
                        'notes' => 'Initial deposit for the Athi River development plot.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000010',
                        'receipt_number' => 'RCP-20261005-000010',
                        'transaction_reference' => 'MPESA-PLT-000010',
                        'amount' => 1000000,
                        'payment_type' => 'installment',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subDays(4),
                        'notes' => 'Additional installment toward the Athi River plot.',
                    ],
                ],
            ],

            [
                'sale_number' => 'PS-20261005-000007',
                'payments' => [
                    [
                        'payment_number' => 'PAY-20261005-000011',
                        'receipt_number' => 'RCP-20261005-000011',
                        'transaction_reference' => 'MPESA-PLT-000011',
                        'amount' => 2000000,
                        'payment_type' => 'deposit',
                        'payment_method' => 'mpesa',
                        'payment_date' => now()->subMonths(2),
                        'notes' => 'Initial deposit for the Ruaka premium plot.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000012',
                        'receipt_number' => 'RCP-20261005-000012',
                        'transaction_reference' => 'BANK-PLT-000012',
                        'amount' => 4000000,
                        'payment_type' => 'installment',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subMonth(),
                        'notes' => 'Second installment for the Ruaka premium plot.',
                    ],
                    [
                        'payment_number' => 'PAY-20261005-000013',
                        'receipt_number' => 'RCP-20261005-000013',
                        'transaction_reference' => 'BANK-PLT-000013',
                        'amount' => 3500000,
                        'payment_type' => 'balance',
                        'payment_method' => 'bank_transfer',
                        'payment_date' => now()->subDays(15),
                        'notes' => 'Final settlement payment for the Ruaka premium plot.',
                    ],
                ],
            ],

            // Sale #8 is cancelled; no payment is seeded for it.
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE / UPDATE PAYMENTS AND RECALCULATE BALANCES
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($payments, $sales): void {
            foreach ($payments as $salePaymentData) {
                $saleNumber = $salePaymentData['sale_number'];
                $sale = $sales->get($saleNumber);

                if (!$sale) {
                    $this->command?->warn(
                        "Plot sale not found: {$saleNumber}"
                    );

                    continue;
                }

                $buyer = $sale->buyer;

                if (!$buyer) {
                    $this->command?->warn(
                        "Buyer not found for plot sale: {$saleNumber}"
                    );

                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | RESOLVE BUYER DETAILS
                |--------------------------------------------------------------------------
                */

                $payerName = trim(implode(' ', array_filter([
                    $buyer->first_name ?? null,
                    $buyer->last_name ?? null,
                ])));

                if ($payerName === '') {
                    $payerName = $buyer->name
                        ?? $buyer->full_name
                        ?? $buyer->email
                        ?? 'Unknown payer';
                }

                foreach ($salePaymentData['payments'] as $payment) {
                    PlotPayment::updateOrCreate(
                        [
                            'payment_number' => $payment['payment_number'],
                        ],
                        [
                            'plot_sale_id' => $sale->id,
                            'receipt_number' => $payment['receipt_number'],
                            'transaction_reference' => $payment['transaction_reference'],
                            'amount' => $payment['amount'],
                            'currency' => $sale->currency ?: 'KES',
                            'payment_type' => $payment['payment_type'],
                            'payment_method' => $payment['payment_method'],
                            'payment_date' => $payment['payment_date'],
                            'payer_name' => $payerName,
                            'payer_phone' => $buyer->phone,
                            'payer_email' => $buyer->email,
                            'notes' => $payment['notes'],
                            'status' => 'completed',
                            'is_active' => true,
                        ]
                    );

                    $this->command?->line(
                        "Payment {$payment['payment_number']} created or updated for {$saleNumber}."
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | RECALCULATE SEEDED SALE BALANCES
            |--------------------------------------------------------------------------
            */

            foreach ($sales as $sale) {
                $totalPaid = PlotPayment::query()
                    ->where('plot_sale_id', $sale->id)
                    ->where('status', 'completed')
                    ->where('is_active', true)
                    ->sum('amount');

                $netSalePrice = max(
                    0,
                    (float) $sale->sale_price
                    - (float) $sale->discount_amount
                );

                $sale->amount_paid = $totalPaid;
                $sale->balance = max(
                    0,
                    $netSalePrice - (float) $totalPaid
                );

                $sale->saveQuietly();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | SUMMARY
        |--------------------------------------------------------------------------
        */

        $paymentCount = PlotPayment::query()->count();

        $totalPaid = PlotPayment::query()
            ->where('status', 'completed')
            ->where('is_active', true)
            ->sum('amount');

        $this->command?->newLine();

        $this->command?->info(
            'PlotPaymentSeeder completed successfully.'
        );

        $this->command?->info(
            "Plot payments in database: {$paymentCount}"
        );

        $this->command?->info(
            'Total active completed plot payments: KES ' .
            number_format((float) $totalPaid, 2)
        );
    }
}