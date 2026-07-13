<?php

namespace App\Http\Controllers\Api\PropertyFeature;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PropertyFeatureAssignmentService;
use App\Helpers\ApiResponse;

class PropertyFeatureAssignmentController extends Controller
{
    protected PropertyFeatureAssignmentService $service;

    public function __construct(PropertyFeatureAssignmentService $service)
    {
        $this->service = $service;
    }

    /*
    |------------------------------------------
    | GET PROPERTY FEATURES
    |------------------------------------------
    */
    public function index($propertyId)
    {
        $features = $this->service->getPropertyFeatures($propertyId);

        if (is_null($features)) {
            return ApiResponse::notFound("Property not found.");
        }

        return ApiResponse::success(
            $features,
            "Property features fetched successfully"
        );
    }

    /*
    |------------------------------------------
    | SYNC FEATURES (BULK REPLACE)
    |------------------------------------------
    */
    public function sync(Request $request, $propertyId)
    {
        $validated = $request->validate([
            'features' => ['required', 'array', 'min:1'],
            'features.*.feature_id' => ['required', 'integer'],
            'features.*.value' => ['nullable'],
            'features.*.note' => ['nullable', 'string'],
            'features.*.is_active' => ['nullable', 'boolean'],
            'features.*.sort_order' => ['nullable', 'integer'],
        ]);

        $property = $this->service->syncFeatures(
            (int) $propertyId,
            $validated['features']
        );

        if (!$property) {
            return ApiResponse::notFound("Property not found.");
        }

        return ApiResponse::updated(
            $property->features,
            "Property features synced successfully"
        );
    }

    /*
    |------------------------------------------
    | UPDATE SINGLE FEATURE (PIVOT UPDATE)
    |------------------------------------------
    */
    public function update(Request $request, $propertyId, $featureId)
    {
        $validated = $request->validate([
            'value' => ['nullable'],
            'note' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $property = $this->service->updateFeature(
            (int) $propertyId,
            (int) $featureId,
            $validated
        );

        if (!$property) {
            return ApiResponse::notFound(
                "Feature not found or not assigned to this property."
            );
        }

        return ApiResponse::updated(
            $property->features,
            "Property feature updated successfully"
        );
    }

    /*
    |------------------------------------------
    | DETACH FEATURE FROM PROPERTY
    |------------------------------------------
    */
    public function detach($propertyId, $featureId)
    {
        $deleted = $this->service->detachFeature(
            (int) $propertyId,
            (int) $featureId
        );

        if (!$deleted) {
            return ApiResponse::notFound("Property not found or feature not attached.");
        }

        return ApiResponse::deleted(
            "Feature removed from property successfully"
        );
    }
}