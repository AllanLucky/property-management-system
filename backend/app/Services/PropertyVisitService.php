<?php

namespace App\Services;

use App\Models\PropertyVisit;
use App\Repositories\Interfaces\PropertyVisitRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class PropertyVisitService
{
    protected PropertyVisitRepositoryInterface $repository;

    public function __construct(PropertyVisitRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function listVisits(int $perPage = 20)
    {
        // RBAC check
        if (!Auth::user()?->can('property-visits.view')) {
            abort(403, 'Unauthorized to view property visits.');
        }

        return $this->repository->all($perPage);
    }

    public function createVisit(array $data): PropertyVisit
    {
        if (!Auth::user()?->can('property-visits.create')) {
            abort(403, 'Unauthorized to create property visits.');
        }

        // Business rule: robots have minimal engagement
        if (!empty($data['is_robot'])) {
            $data['duration'] = 0;
            $data['page_views'] = 1;
        }

        return $this->repository->create($data);
    }

    public function updateVisit(PropertyVisit $visit, array $data): PropertyVisit
    {
        if (!Auth::user()?->can('property-visits.edit')) {
            abort(403, 'Unauthorized to edit property visits.');
        }

        return $this->repository->update($visit, $data);
    }

    public function deleteVisit(PropertyVisit $visit): bool
    {
        if (!Auth::user()?->can('property-visits.delete')) {
            abort(403, 'Unauthorized to delete property visits.');
        }

        return $this->repository->delete($visit);
    }
}
