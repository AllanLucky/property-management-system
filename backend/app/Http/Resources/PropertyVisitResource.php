<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PropertyVisitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'id'         => $this->id,
            'visit_uuid' => $this->visit_uuid,

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () use ($user) {
                $data = [
                    'id'            => $this->property->id,
                    'title'         => $this->property->title,
                    'slug'          => $this->property->slug,
                    'property_code' => $this->property->property_code,
                    'thumbnail'     => $this->property->thumbnail,
                ];

                // RBAC: expose extra details only if user has permission
                if ($user?->can('properties.view-sensitive')) {
                    $data['status'] = $this->property->status;
                    $data['price']  = $this->property->price;
                }

                return $data;
            }),

            'user' => $this->whenLoaded('user', function () {
                return [
                    'id'    => $this->user->id,
                    'name'  => trim($this->user->first_name . ' ' . $this->user->last_name),
                    'email' => $this->user->email,
                    'image' => $this->user->image,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | VISITOR INFORMATION
            |--------------------------------------------------------------------------
            */
            'visitor' => [
                'type'       => $this->visitor_type,
                'session_id' => $this->session_id,
                'is_unique'  => (bool) $this->is_unique,
                // RBAC: only expose IP & UA if permitted
                'ip_address' => $user?->can('property-visits.view-sensitive') ? $this->ip_address : null,
                'user_agent' => $user?->can('property-visits.view-sensitive') ? $this->user_agent : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | DEVICE INFORMATION
            |--------------------------------------------------------------------------
            */
            'device' => [
                'device'           => $this->device,
                'device_name'      => $this->device_name,
                'device_type'      => $this->device_type,
                'browser'          => $this->browser,
                'browser_version'  => $this->browser_version,
                'platform'         => $this->platform,
                'platform_version' => $this->platform_version,
                'operating_system' => $this->operating_system,
                'is_mobile'        => (bool) $this->is_mobile,
                'is_tablet'        => (bool) $this->is_tablet,
                'is_desktop'       => (bool) $this->is_desktop,
                'is_robot'         => (bool) $this->is_robot,
            ],

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */
            'location' => [
                'country'       => $this->country,
                'region'        => $this->region,
                'county'        => $this->county,
                'city'          => $this->city,
                'latitude'      => $this->latitude,
                'longitude'     => $this->longitude,
                'timezone'      => $this->timezone,
                'full_location' => $this->location,
            ],

            /*
            |--------------------------------------------------------------------------
            | TRAFFIC SOURCE
            |--------------------------------------------------------------------------
            */
            'traffic' => [
                'referer'        => $this->referer,
                'referer_domain' => $this->referer ? parse_url($this->referer, PHP_URL_HOST) : null,
                'source'         => $this->source,
                'medium'         => $this->medium,
                'campaign'       => $this->campaign,
            ],

            /*
            |--------------------------------------------------------------------------
            | ENGAGEMENT
            |--------------------------------------------------------------------------
            */
            'engagement' => [
                'duration'          => $this->duration,
                'page_views'        => $this->page_views,
                'scroll_percentage' => $this->scroll_percentage,
                'contact_clicked'   => (bool) $this->contact_clicked,
                'call_clicked'      => (bool) $this->call_clicked,
                'whatsapp_clicked'  => (bool) $this->whatsapp_clicked,
                'email_clicked'     => (bool) $this->email_clicked,
                'bookmarked'        => (bool) $this->bookmarked,
                'shared'            => (bool) $this->shared,
                'scheduled_visit'   => (bool) $this->scheduled_visit,
                // Computed engagement rate
                'engagement_rate'   => $this->page_views > 0
                    ? round(($this->scroll_percentage / 100) * $this->page_views, 2)
                    : 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */
            'visited_at'       => $this->visited_at?->toDateTimeString(),
            'visited_at_human' => $this->visited_at_human,
            'created_at'       => $this->created_at?->toDateTimeString(),
            'updated_at'       => $this->updated_at?->toDateTimeString(),
        ];
    }
}
