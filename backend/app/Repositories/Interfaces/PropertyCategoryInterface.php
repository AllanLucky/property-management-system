<?php

namespace App\Repositories\Interfaces;

interface PropertyCategoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC CRUD
    |--------------------------------------------------------------------------
    */
    public function getAll(array $filters = []);

    public function getById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);

    public function restore(int $id);

    public function forceDelete(int $id);

    /*
    |--------------------------------------------------------------------------
    | EXTRA BUSINESS LOGIC
    |--------------------------------------------------------------------------
    */

    /**
     * Toggle active/inactive status
     */
    public function toggleStatus(int $id);

    /**
     * Toggle featured category
     */
    public function toggleFeatured(int $id);

    /**
     * Increment views count (analytics)
     */
    public function incrementViews(int $id);
}