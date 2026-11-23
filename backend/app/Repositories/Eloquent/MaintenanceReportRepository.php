<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\Maintenance\MaintenanceReportRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MaintenanceReportRepository implements MaintenanceReportRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | SHARED FILTERS
    |--------------------------------------------------------------------------
    */

    protected function applyRequestFilters($query, array $filters)
    {
        return $query
            ->when($filters['property_id'] ?? null, fn ($q, $id) =>
                $q->where('property_id', $id)
            )
            ->when($filters['unit_id'] ?? null, fn ($q, $id) =>
                $q->where('unit_id', $id)
            )
            ->when($filters['tenant_id'] ?? null, fn ($q, $id) =>
                $q->where('tenant_id', $id)
            )
            ->when($filters['technician_id'] ?? null, fn ($q, $id) =>
                $q->where('technician_id', $id)
            )
            ->when($filters['category_id'] ?? null, fn ($q, $id) =>
                $q->where('category_id', $id)
            )
            ->when($filters['status'] ?? null, fn ($q, $status) =>
                $q->where('status', $status)
            )
            ->when($filters['date_from'] ?? null, fn ($q, $date) =>
                $q->whereDate('created_at', '>=', $date)
            )
            ->when($filters['date_to'] ?? null, fn ($q, $date) =>
                $q->whereDate('created_at', '<=', $date)
            );
    }

    protected function requestQuery(array $filters = [])
    {
        $query = MaintenanceRequest::query();

        return $this->applyRequestFilters($query, $filters);
    }

    protected function expenseQuery(array $filters = [])
    {
        $query = DB::table('maintenance_expenses');

        return $query
            ->when($filters['property_id'] ?? null, fn ($q, $id) =>
                $q->where('property_id', $id)
            )
            ->when($filters['category_id'] ?? null, fn ($q, $id) =>
                $q->where('category_id', $id)
            )
            ->when($filters['date_from'] ?? null, fn ($q, $date) =>
                $q->whereDate('created_at', '>=', $date)
            )
            ->when($filters['date_to'] ?? null, fn ($q, $date) =>
                $q->whereDate('created_at', '<=', $date)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GENERAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function overview(array $filters = []): array
    {
        $requests = $this->requestQuery($filters);

        $total = (clone $requests)->count();

        $completed = (clone $requests)
            ->where('status', 'completed')
            ->count();

        $ongoing = (clone $requests)
            ->whereIn('status', ['assigned', 'in_progress', 'on_hold'])
            ->count();

        $pending = (clone $requests)
            ->where('status', 'pending')
            ->count();

        $overdue = (clone $requests)
            ->whereIn('status', ['assigned', 'in_progress', 'on_hold'])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', now())
            ->count();

        return [
            'total_requests' => $total,

            'completed_requests' => $completed,

            'ongoing_requests' => $ongoing,

            'pending_requests' => $pending,

            'overdue_requests' => $overdue,

            'completion_rate' => $total > 0
                ? round(($completed / $total) * 100, 2)
                : 0,

            'total_maintenance_cost' => (float) (
                (clone $requests)
                    ->where('status', 'completed')
                    ->sum('total_cost')
            ),
        ];
    }

    public function statistics(array $filters = []): array
    {
        $requests = $this->requestQuery($filters);

        return [
            'total' => (clone $requests)->count(),

            'pending' => (clone $requests)
                ->where('status', 'pending')
                ->count(),

            'approved' => (clone $requests)
                ->where('status', 'approved')
                ->count(),

            'rejected' => (clone $requests)
                ->where('status', 'rejected')
                ->count(),

            'assigned' => (clone $requests)
                ->where('status', 'assigned')
                ->count(),

            'in_progress' => (clone $requests)
                ->where('status', 'in_progress')
                ->count(),

            'on_hold' => (clone $requests)
                ->where('status', 'on_hold')
                ->count(),

            'completed' => (clone $requests)
                ->where('status', 'completed')
                ->count(),

            'cancelled' => (clone $requests)
                ->where('status', 'cancelled')
                ->count(),

            'total_completed_cost' => (float) (
                (clone $requests)
                    ->where('status', 'completed')
                    ->sum('total_cost')
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function financialSummary(array $filters = []): array
    {
        $expenses = $this->expenseQuery($filters);

        $totalExpenses = (float) (clone $expenses)->sum('amount');

        $completedRequests = $this->requestQuery($filters)
            ->where('status', 'completed');

        $completedCost = (float) $completedRequests->sum('total_cost');

        return [
            'total_expenses' => $totalExpenses,

            'total_completed_maintenance_cost' => $completedCost,

            'total_completed_jobs' => (clone $completedRequests)->count(),

            'average_expense' => (float) (
                (clone $expenses)->avg('amount') ?? 0
            ),

            'highest_expense' => (float) (
                (clone $expenses)->max('amount') ?? 0
            ),

            'lowest_expense' => (float) (
                (clone $expenses)->min('amount') ?? 0
            ),
        ];
    }

    public function maintenanceCosts(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->where('status', 'completed')
            ->select([
                'id',
                'reference',
                'property_id',
                'unit_id',
                'category_id',
                'technician_id',
                'completed_at',
                'total_cost',
            ])
            ->orderByDesc('completed_at')
            ->get();
    }

    public function expensesByCategory(array $filters = []): Collection
    {
        return $this->expenseQuery($filters)
            ->select(
                'category_id',
                DB::raw('COUNT(*) as expenses_count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('category_id')
            ->orderByDesc('total_amount')
            ->get();
    }

    public function expensesByProperty(array $filters = []): Collection
    {
        return $this->expenseQuery($filters)
            ->select(
                'property_id',
                DB::raw('COUNT(*) as expenses_count'),
                DB::raw('SUM(amount) as total_amount')
            )
            ->groupBy('property_id')
            ->orderByDesc('total_amount')
            ->get();
    }

    public function monthlyExpenses(array $filters = []): Collection
    {
        return $this->expenseQuery($filters)
            ->select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as expenses_count')
            )
            ->groupBy(
                DB::raw('YEAR(created_at)'),
                DB::raw('MONTH(created_at)')
            )
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | OPERATIONAL REPORTS
    |--------------------------------------------------------------------------
    */

    public function requestsByStatus(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->select(
                'status',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('status')
            ->orderByDesc('total')
            ->get();
    }

    public function requestsByCategory(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->select(
                'category_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->get();
    }

    public function requestsByProperty(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->select(
                'property_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy('property_id')
            ->orderByDesc('total')
            ->get();
    }

    public function requestsByTechnician(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->select(
                'technician_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status IN ("assigned", "in_progress", "on_hold") THEN 1 ELSE 0 END) as ongoing')
            )
            ->whereNotNull('technician_id')
            ->groupBy('technician_id')
            ->orderByDesc('completed')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PERFORMANCE REPORTS
    |--------------------------------------------------------------------------
    */

    public function technicianPerformance(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->whereNotNull('technician_id')
            ->select(
                'technician_id',
                DB::raw('COUNT(*) as total_assigned'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as total_completed'),
                DB::raw('SUM(CASE WHEN status IN ("assigned", "in_progress", "on_hold") THEN 1 ELSE 0 END) as total_ongoing'),
                DB::raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as total_cancelled'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN total_cost ELSE 0 END) as total_cost')
            )
            ->groupBy('technician_id')
            ->orderByDesc('total_completed')
            ->get();
    }

    public function completionTrends(array $filters = []): Collection
    {
        $query = $this->requestQuery($filters)
            ->where('status', 'completed')
            ->whereNotNull('completed_at');

        return $query
            ->select(
                DB::raw('YEAR(completed_at) as year'),
                DB::raw('MONTH(completed_at) as month'),
                DB::raw('COUNT(*) as completed_count'),
                DB::raw('SUM(total_cost) as total_cost')
            )
            ->groupBy(
                DB::raw('YEAR(completed_at)'),
                DB::raw('MONTH(completed_at)')
            )
            ->orderBy('year')
            ->orderBy('month')
            ->get();
    }

    public function averageResolutionTime(array $filters = []): array
    {
        $query = $this->requestQuery($filters)
            ->where('status', 'completed')
            ->whereNotNull('created_at')
            ->whereNotNull('completed_at');

        $averageHours = (clone $query)
            ->selectRaw(
                'AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) / 3600 as average_hours'
            )
            ->value('average_hours');

        $total = (clone $query)->count();

        return [
            'total_completed' => $total,

            'average_hours' => round((float) ($averageHours ?? 0), 2),

            'average_days' => round(
                (float) ($averageHours ?? 0) / 24,
                2
            ),
        ];
    }

    public function overdueReport(array $filters = []): Collection
    {
        return $this->requestQuery($filters)
            ->whereIn('status', ['assigned', 'in_progress', 'on_hold'])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', now())
            ->orderBy('scheduled_at')
            ->get();
    }
}
