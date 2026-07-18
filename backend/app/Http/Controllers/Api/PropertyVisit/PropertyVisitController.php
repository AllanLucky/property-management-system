<?php

namespace App\Http\Controllers\Api\PropertyVisit;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyVisit\CreatePropertyVisitRequest;
use App\Http\Requests\PropertyVisit\UpdatePropertyVisitRequest;
use App\Models\PropertyVisit;
use App\Services\PropertyVisitService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class PropertyVisitController extends Controller
{
    protected PropertyVisitService $service;

    public function __construct(PropertyVisitService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of property visits.
     */
    public function index(Request $request)
    {
        $visits = $this->service->listVisits($request->get('per_page', 20));
        return ApiResponse::paginated($visits, 'Property visits fetched successfully');
    }

    /**
     * Store a newly created property visit.
     */
    public function store(CreatePropertyVisitRequest $request)
    {
        $visit = $this->service->createVisit($request->validated());
        return ApiResponse::created($visit, 'Property visit created successfully');
    }

    /**
     * Display the specified property visit.
     */
    public function show(PropertyVisit $propertyVisit)
    {
        return ApiResponse::success(
            $propertyVisit->load(['property', 'user']),
            'Property visit fetched successfully'
        );
    }

    /**
     * Update the specified property visit.
     */
    public function update(UpdatePropertyVisitRequest $request, PropertyVisit $propertyVisit)
    {
        $visit = $this->service->updateVisit($propertyVisit, $request->validated());
        return ApiResponse::updated($visit, 'Property visit updated successfully');
    }

    /**
     * Remove the specified property visit.
     */
    public function destroy(PropertyVisit $propertyVisit)
    {
        $this->service->deleteVisit($propertyVisit);
        return ApiResponse::deleted('Property visit deleted successfully');
    }
}
