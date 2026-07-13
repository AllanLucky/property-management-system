<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\UserResource;
use App\Models\RoleRequest;

class RoleRequestResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $status = $this->status;

        $isPending  = $status === RoleRequest::STATUS_PENDING;
        $isApproved = $status === RoleRequest::STATUS_APPROVED;
        $isRejected = $status === RoleRequest::STATUS_REJECTED;

        $isProcessed = $isApproved || $isRejected;

        return [
            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */
            'user' => $this->whenLoaded('user', fn () =>
                new UserResource($this->user)
            ),

            /*
            |--------------------------------------------------------------------------
            | ROLE DATA
            |--------------------------------------------------------------------------
            */
            'requested_role' => $this->requested_role,
            'requested_role_label' => $this->requested_role_label,
            'reason' => $this->reason,

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => $status,
            'status_label' => $this->status_label,

            'is_pending' => $isPending,
            'is_approved' => $isApproved,
            'is_rejected' => $isRejected,
            'is_processed' => $isProcessed,

            /*
            |--------------------------------------------------------------------------
            | REVIEW INFO
            |--------------------------------------------------------------------------
            */
            'reviewer' => $this->whenLoaded('reviewer', fn () =>
                new UserResource($this->reviewer)
            ),

            'reviewed_at' => optional($this->reviewed_at)?->toDateTimeString(),
            'admin_notes' => $this->admin_notes,

            /*
            |--------------------------------------------------------------------------
            | 🔥 TIMELINE (IMPORTANT FIX)
            |--------------------------------------------------------------------------
            */
            'timeline' => collect($this->timeline ?? [])->map(function ($item) {
                return [
                    'title' => $item['title'] ?? '',
                    'type' => $item['type'] ?? 'system',
                    'user_id' => $item['user_id'] ?? null,
                    'timestamp' => $item['timestamp'] ?? null,
                ];
            })->values(),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => optional($this->created_at)?->toDateTimeString(),
            'updated_at' => optional($this->updated_at)?->toDateTimeString(),

            /*
            |--------------------------------------------------------------------------
            | FRONTEND META
            |--------------------------------------------------------------------------
            */
            'meta' => [
                'can_be_approved' => $isPending,
                'can_be_rejected' => $isPending,
                'can_be_re_requested' => $isRejected,

                'is_processed' => $isProcessed,
                'is_pending' => $isPending,
                'is_final' => $isProcessed,

                'status_color' => match (true) {
                    $isApproved => 'green',
                    $isRejected => 'red',
                    $isPending  => 'yellow',
                    default     => 'gray',
                },
            ],
        ];
    }
}