<?php

namespace Database\Seeders;

use App\Models\Plot;
use App\Models\PlotSale;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PlotSaleSeeder extends Seeder
{
    /**
     * Seed the two existing plot sales without creating duplicates.
     *
     * Expected summary:
     * - Total sales: 2
     * - Reserved: 1
     * - Completed: 1
     * - Total collected: KES 10,500,000
     * - Outstanding: KES 3,000,000
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | EXISTING SALE DATA
        |--------------------------------------------------------------------------
        |
        | These sale numbers are stable identifiers. Do not generate new sale
        | numbers when rerunning this seeder.
        |
        */

        $sales = [
            [
                'sale_number' => 'PS-20261005-000007',
                'plot_number' => 'RUAKA/7/7846',
                'plot_title' => 'Ruaka Premium Plot',
                'buyer_email' => 'samuel.kiptoo@example.com',

                'sale_price' => 9800000,
                'deposit_amount' => 2000000,
                'discount_amount' => 300000,
                'amount_paid' => 9500000,

                'payment_frequency' => 'once',
                'status' => 'completed',

                'sale_date' => '2026-10-14',
                'due_date' => null,
                'completion_date' => '2026-09-29',

                'notes' => 'Premium plot sale completed after full settlement and completion of documentation.',
            ],

            [
                'sale_number' => 'PS-20261005-000003',
                'plot_number' => 'SYOKIMAU/3/3421',
                'plot_title' => 'Syokimau Investment Plot',
                'buyer_email' => 'brian.mwangi@example.com',

                'sale_price' => 4200000,
                'deposit_amount' => 1000000,
                'discount_amount' => 200000,
                'amount_paid' => 1000000,

                'payment_frequency' => 'monthly',
                'status' => 'reserved',

                'sale_date' => '2026-10-14',
                'due_date' => '2026-11-14',
                'completion_date' => null,

                'notes' => 'Plot reserved pending completion of the agreed payment plan.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | VALIDATE BUYERS AND PLOTS
        |--------------------------------------------------------------------------
        */

        $preparedSales = [];

        foreach ($sales as $saleData) {
            $plot = Plot::query()
                ->where('plot_number', $saleData['plot_number'])
                ->first();

            if (!$plot) {
                throw new RuntimeException(
                    "Plot not found: {$saleData['plot_number']}. " .
                    'Run PlotSeeder and verify the plot number first.'
                );
            }

            $buyer = User::query()
                ->where('email', $saleData['buyer_email'])
                ->first();

            if (!$buyer) {
                throw new RuntimeException(
                    "Buyer not found: {$saleData['buyer_email']}. " .
                    'Create the buyer account before running PlotSaleSeeder.'
                );
            }

            $salePrice = (float) $saleData['sale_price'];
            $discount = (float) $saleData['discount_amount'];
            $amountPaid = (float) $saleData['amount_paid'];

            $netSalePrice = max(0, $salePrice - $discount);
            $balance = max(0, $netSalePrice - $amountPaid);

            if ($amountPaid > $netSalePrice) {
                throw new RuntimeException(
                    "Amount paid exceeds the net sale price for " .
                    $saleData['sale_number']
                );
            }

            $preparedSales[] = [
                'data' => $saleData,
                'plot' => $plot,
                'buyer' => $buyer,
                'net_sale_price' => $netSalePrice,
                'balance' => $balance,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | ASSIGN AGENTS
        |--------------------------------------------------------------------------
        */

        $agents = User::query()
            ->role('agent')
            ->orderBy('id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | CREATE / UPDATE EXISTING SALES
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($preparedSales, $agents) {
            foreach ($preparedSales as $prepared) {
                $saleData = $prepared['data'];
                $plot = $prepared['plot'];
                $buyer = $prepared['buyer'];

                /*
                |--------------------------------------------------------------------------
                | PRESERVE EXISTING AGENT
                |--------------------------------------------------------------------------
                |
                | If the sale already has an agent, preserve that assignment.
                | Otherwise, assign the first available agent when possible.
                |
                */

                $existingSale = PlotSale::query()
                    ->where('sale_number', $saleData['sale_number'])
                    ->first();

                $agentId = $existingSale?->agent_id
                    ?? $agents->first()?->id;

                /*
                |--------------------------------------------------------------------------
                | UPDATE SALE USING STABLE SALE NUMBER
                |--------------------------------------------------------------------------
                */

                PlotSale::updateOrCreate(
                    [
                        'sale_number' => $saleData['sale_number'],
                    ],
                    [
                        'plot_id' => $plot->id,
                        'buyer_id' => $buyer->id,
                        'agent_id' => $agentId,

                        'sale_date' => $saleData['sale_date'],

                        'sale_price' => $saleData['sale_price'],
                        'deposit_amount' => $saleData['deposit_amount'],
                        'discount_amount' => $saleData['discount_amount'],
                        'amount_paid' => $saleData['amount_paid'],
                        'balance' => $prepared['balance'],

                        'currency' => 'KES',
                        'payment_frequency' => $saleData['payment_frequency'],

                        'due_date' => $saleData['due_date'],
                        'completion_date' => $saleData['completion_date'],

                        'notes' => $saleData['notes'],
                        'status' => $saleData['status'],
                        'is_active' => true,
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | SYNCHRONIZE PLOT STATUS
                |--------------------------------------------------------------------------
                */

                $plotStatus = match ($saleData['status']) {
                    'completed' => 'sold',
                    'reserved', 'approved' => 'reserved',
                    'pending', 'cancelled' => 'available',
                    default => $plot->status,
                };

                $plot->update([
                    'status' => $plotStatus,
                    'is_active' => $plotStatus !== 'sold',
                ]);

                $this->command?->info(
                    "Sale {$saleData['sale_number']} updated for {$plot->title}."
                );

                $this->command?->line(
                    'Net price: KES ' .
                    number_format($prepared['net_sale_price'], 2) .
                    ' | Paid: KES ' .
                    number_format((float) $saleData['amount_paid'], 2) .
                    ' | Balance: KES ' .
                    number_format($prepared['balance'], 2)
                );
            }
        });

        /*
        |--------------------------------------------------------------------------
        | DATABASE SUMMARY
        |--------------------------------------------------------------------------
        |
        | This summary includes all non-deleted plot sales in the database.
        | If other sales already exist, the count may exceed two.
        |
        */

        $query = PlotSale::query();

        $this->command?->newLine();
        $this->command?->info('PlotSaleSeeder completed successfully.');

        $this->command?->info(
            'Total plot sales in database: ' . (clone $query)->count()
        );

        $statuses = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        foreach ($statuses as $status => $total) {
            $this->command?->line(
                ucfirst($status) . ': ' . $total
            );
        }

        $totals = (clone $query)
            ->selectRaw('
                COALESCE(SUM(amount_paid), 0) as total_paid,
                COALESCE(SUM(balance), 0) as total_balance
            ')
            ->first();

        $this->command?->info(
            'Total collected: KES ' .
            number_format((float) $totals->total_paid, 2)
        );

        $this->command?->info(
            'Total outstanding: KES ' .
            number_format((float) $totals->total_balance, 2)
        );
    }
}
