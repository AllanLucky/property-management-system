<?php

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyFeature;

class PropertyFeatureAssignmentService
{
    /*
    |------------------------------------------
    | GET FEATURES
    |------------------------------------------
    */
    public function getPropertyFeatures(int|string $propertyId)
    {
        $property = Property::with('features')->find($propertyId);

        return $property?->features;
    }

    /*
    |------------------------------------------
    | SYNC FEATURES (BULK REPLACE)
    |------------------------------------------
    */
    public function syncFeatures(int|string $propertyId, array $features)
    {
        $property = Property::find($propertyId);

        if (!$property) {
            return null;
        }

        $syncData = [];

        foreach ($features as $feature) {

            $featureId = $feature['feature_id'] ?? null;

            if (!$featureId) {
                continue;
            }

            // Ensure feature exists (safe check)
            if (!PropertyFeature::whereKey($featureId)->exists()) {
                continue;
            }

            $syncData[$featureId] = [
                'value'      => $feature['value'] ?? null,
                'note'       => $feature['note'] ?? null,
                'is_active'  => $feature['is_active'] ?? true,
                'sort_order' => $feature['sort_order'] ?? 0,
            ];
        }

        $property->features()->sync($syncData);

        return $property->load('features');
    }

    /*
    |------------------------------------------
    | UPDATE SINGLE FEATURE
    |------------------------------------------
    */
    public function updateFeature(int|string $propertyId, int|string $featureId, array $data)
    {
        $property = Property::find($propertyId);

        if (!$property) {
            return null;
        }

        if (!$property->features()->whereKey($featureId)->exists()) {
            return null;
        }

        $property->features()->updateExistingPivot($featureId, [
            'value'      => $data['value'] ?? null,
            'note'       => $data['note'] ?? null,
            'is_active'  => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);

        return $property->load('features');
    }

    /*
    |------------------------------------------
    | DETACH FEATURE
    |------------------------------------------
    */
    public function detachFeature(int|string $propertyId, int|string $featureId)
    {
        $property = Property::find($propertyId);

        if (!$property) {
            return false;
        }

        $property->features()->detach($featureId);

        return true;
    }
}