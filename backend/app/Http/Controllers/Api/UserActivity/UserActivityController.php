<?php

namespace App\Http\Controllers\Api\UserActivity;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserActivity\ActivityLogFilterRequest;
use App\Http\Resources\UserActivityResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserActivityController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST ALL ACTIVITIES (ADMIN)
    |--------------------------------------------------------------------------
    */
    public function index(ActivityLogFilterRequest $request)
    {
        try {
            $this->authorize('viewAny', ActivityLog::class);

            $filters = $request->validated();

            $activities = ActivityLog::query()
                ->with('user')
                ->filter($filters)
                ->when($filters['subject_type'] ?? null, fn ($q, $type) =>
                    $q->where('subject_type', $type)
                )
                ->when($filters['subject_id'] ?? null, fn ($q, $id) =>
                    $q->where('subject_id', $id)
                )
                ->paginate($filters['per_page'] ?? 15);

            return ApiResponse::success(
                UserActivityResource::collection($activities),
                'User activities fetched successfully.',
                200,
                $this->paginationMeta($activities)
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch user activities.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE ACTIVITY
    |--------------------------------------------------------------------------
    */
    public function show(int $id)
    {
        try {
            $activity = ActivityLog::with('user')->find($id);

            if (!$activity) {
                return ApiResponse::error('Activity not found', [], 404);
            }

            $this->authorize('view', $activity);

            return ApiResponse::success(
                new UserActivityResource($activity),
                'Activity fetched successfully.'
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch activity.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CURRENT USER ACTIVITIES
    |--------------------------------------------------------------------------
    */
    public function myActivities(Request $request)
    {
        try {
            $user = $request->user();

            $activities = ActivityLog::query()
                ->with('user')
                ->forUser($user->id)
                ->latestFirst()
                ->paginate($request->integer('per_page', 15));

            return ApiResponse::success(
                UserActivityResource::collection($activities),
                'Your activities fetched successfully.',
                200,
                $this->paginationMeta($activities)
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch your activities.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE ACTIVITY (SUPER ADMIN)
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id)
    {
        try {
            $activity = ActivityLog::find($id);

            if (!$activity) {
                return ApiResponse::error('Activity not found', [], 404);
            }

            $this->authorize('delete', $activity);

            $activity->delete();

            return ApiResponse::success(
                null,
                'Activity deleted successfully.'
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to delete activity.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE ACTIVITY (ADMIN TOOL)
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        try {
            $this->authorize('create', ActivityLog::class);

            $data = $request->validate([
                'user_id' => ['nullable', 'exists:users,id'],
                'action' => ['required', 'string'],
                'description' => ['nullable', 'string'],
                'subject_type' => ['nullable', 'string'],
                'subject_id' => ['nullable', 'integer'],
                'meta' => ['nullable', 'array'],
            ]);

            $user = isset($data['user_id'])
                ? User::find($data['user_id'])
                : $request->user();

            $activity = ActivityLog::record(
                userId: $user?->id,
                action: strtolower($data['action']),
                description: $data['description'] ?? null,
                subjectType: $data['subject_type'] ?? null,
                subjectId: $data['subject_id'] ?? null,
                meta: $data['meta'] ?? [],
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );

            return ApiResponse::success(
                new UserActivityResource($activity),
                'Activity logged successfully.',
                201
            );

        } catch (ValidationException $e) {
            return ApiResponse::error('Validation failed', $e->errors(), 422);

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to log activity.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATION META HELPER
    |--------------------------------------------------------------------------
    */
    private function paginationMeta($paginator): array
    {
        return [
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}