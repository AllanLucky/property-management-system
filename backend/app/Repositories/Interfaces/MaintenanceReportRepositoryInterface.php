<?php

namespace App\Repositories\Interfaces;

use Illuminate\Support\Collection;

interface MaintenanceReportRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | GENERAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function overview(array $filters = []): array;

    public function statistics(array $filters = []): array;

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function financialSummary(array $filters = []): array;

    public function maintenanceCosts(array $filters = []): Collection;

    public function expensesByCategory(array $filters = []): Collection;

    public function expensesByProperty(array $filters = []): Collection;

    public function monthlyExpenses(array $filters = []): Collection;

    /*
    |--------------------------------------------------------------------------
    | OPERATIONAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function requestsByStatus(array $filters = []): Collection;

    public function requestsByCategory(array $filters = []): Collection;

    public function requestsByProperty(array $filters = []): Collection;

    public function requestsByTechnician(array $filters = []): Collection;

    /*
    |--------------------------------------------------------------------------
    | PERFORMANCE REPORTS
    |--------------------------------------------------------------------------
    */

    public function technicianPerformance(array $filters = []): Collection;

    public function completionTrends(array $filters = []): Collection;

    public function averageResolutionTime(array $filters = []): array;

    public function overdueReport(array $filters = []): Collection;
}