<?php

namespace App\Http\Controllers\Api\PropertyAmenity;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyAmenity\CreatePropertyAmenityRequest;
use App\Http\Requests\PropertyAmenity\UpdatePropertyAmenityRequest;
use App\Http\Resources\PropertyAmenityResource;
use App\Models\Amenity;
use App\Models\Property;
use App\Services\PropertyAmenityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PropertyAmenityController extends Controller
{
    protected PropertyAmenityService $service;

    public function __construct(PropertyAmenityService $service)
    {
        $this->service = $service;

        $this->middleware('permission:property-amenities.view')->only(['index']);
        $this->middleware('permission:property-amenities.create')->only(['store']);
        $this->middleware('permission:property-amenities.edit')->only(['update']);
        $this->middleware('permission:property-amenities.delete')->only(['destroy']);
        $this->middleware('permission:property-amenities.toggle')->only(['toggleStatus']);
        $this->middleware('permission:property-amenities.sync')->only(['sync']);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST PROPERTY AMENITIES
    |--------------------------------------------------------------------------
    */
    public function index(Property $property)
    {
        try {
            $amenities = $this->service->getAmenities($property);

            return ApiResponse::success(
                PropertyAmenityResource::collection($amenities),
                'Property amenities fetched successfully'
            );
        } catch (\Throwable $e) {

            Log::error('Property Amenity Index Error', [
                'property_id' => $property->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return ApiResponse::error(
                'Failed to fetch property amenities',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACH AMENITY
    |--------------------------------------------------------------------------
    */
    public function store(
        CreatePropertyAmenityRequest $request,
        Property $property,
        Amenity $amenity
    ) {
        try {

            $exists = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->exists();

            if ($exists) {
                return ApiResponse::error(
                    'Amenity already attached to this property',
                    null,
                    422
                );
            }

            $this->service->attachAmenity(
                $property,
                $amenity,
                $request->validated(),
                auth()->user()
            );

            $attached = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->first();

            return ApiResponse::created(
                new PropertyAmenityResource($attached),
                'Amenity attached successfully'
            );

        } catch (\Throwable $e) {

            Log::error('Attach Property Amenity Error', [
                'property_id' => $property->id,
                'amenity_id' => $amenity->id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to attach amenity',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE AMENITY
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdatePropertyAmenityRequest $request,
        Property $property,
        Amenity $amenity
    ) {
        try {

            $exists = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->exists();

            if (!$exists) {
                return ApiResponse::notFound(
                    'Amenity not attached to this property'
                );
            }

            $this->service->updateAmenity(
                $property,
                $amenity,
                $request->validated(),
                auth()->user()
            );

            $updated = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->first();

            return ApiResponse::updated(
                new PropertyAmenityResource($updated),
                'Property amenity updated successfully'
            );

        } catch (\Throwable $e) {

            Log::error('Update Property Amenity Error', [
                'property_id' => $property->id,
                'amenity_id' => $amenity->id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to update property amenity',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE AMENITY
    |--------------------------------------------------------------------------
    */
    public function destroy(Property $property, Amenity $amenity)
    {
        try {

            $exists = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->exists();

            if (!$exists) {
                return ApiResponse::notFound(
                    'Amenity not attached to this property'
                );
            }

            $this->service->detachAmenity(
                $property,
                $amenity,
                auth()->user()
            );

            return ApiResponse::deleted(
                'Amenity removed successfully'
            );

        } catch (\Throwable $e) {

            Log::error('Delete Property Amenity Error', [
                'property_id' => $property->id,
                'amenity_id' => $amenity->id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to remove amenity',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(Property $property, Amenity $amenity)
    {
        try {

            $exists = $property->amenities()
                ->where('amenity_id', $amenity->id)
                ->exists();

            if (!$exists) {
                return ApiResponse::notFound(
                    'Amenity not attached to this property'
                );
            }

            $updated = $this->service->toggleStatus(
                $property,
                $amenity
            );

            return ApiResponse::success(
                new PropertyAmenityResource($updated),
                'Property amenity status updated successfully'
            );

        } catch (\Throwable $e) {

            Log::error('Toggle Property Amenity Error', [
                'property_id' => $property->id,
                'amenity_id' => $amenity->id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to toggle property amenity status',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC AMENITIES
    |--------------------------------------------------------------------------
    */
    public function sync(Request $request, Property $property)
    {
        try {

            $validated = $request->validate([
                'amenities' => ['required', 'array'],
                'amenities.*.id' => ['required', 'exists:amenities,id'],
            ]);

            $syncData = [];

            foreach ($validated['amenities'] as $item) {

                $syncData[$item['id']] = [
                    'is_included' => $item['is_included'] ?? true,
                    'is_available' => $item['is_available'] ?? true,
                    'distance' => $item['distance'] ?? null,
                    'walking_minutes' => $item['walking_minutes'] ?? null,
                    'note' => $item['note'] ?? null,
                ];
            }

            $this->service->syncAmenities(
                $property,
                $syncData
            );

            $amenities = $this->service->getAmenities($property);

            return ApiResponse::success(
                PropertyAmenityResource::collection($amenities),
                'Property amenities synced successfully'
            );

        } catch (\Throwable $e) {

            Log::error('Sync Property Amenities Error', [
                'property_id' => $property->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return ApiResponse::error(
                'Failed to sync property amenities',
                [
                    'exception' => $e->getMessage(),
                ],
                500
            );
        }
    }
}