<?php

namespace App\Http\Requests\PropertyVisit;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyVisitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // ✅ RBAC check using Spatie Permissions
        // Only allow if user has the "property-visits.edit" permission
        return $this->user()?->can('property-visits.edit') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'property_id'      => ['sometimes', 'exists:properties,id'],
            'user_id'          => ['sometimes', 'nullable', 'exists:users,id'],
            'session_id'       => ['sometimes', 'uuid'],
            'ip_address'       => ['sometimes', 'ip'],
            'user_agent'       => ['sometimes', 'string'],

            // Device & platform
            'device'           => ['sometimes', 'string'],
            'device_type'      => ['sometimes', 'string'],
            'browser'          => ['sometimes', 'string'],
            'browser_version'  => ['sometimes', 'string'],
            'platform'         => ['sometimes', 'string'],
            'platform_version' => ['sometimes', 'string'],
            'operating_system' => ['sometimes', 'string'],

            // Flags
            'is_mobile'        => ['sometimes', 'boolean'],
            'is_tablet'        => ['sometimes', 'boolean'],
            'is_desktop'       => ['sometimes', 'boolean'],
            'is_robot'         => ['sometimes', 'boolean'],
            'is_unique'        => ['sometimes', 'boolean'],

            // Location
            'country'          => ['sometimes', 'string'],
            'region'           => ['sometimes', 'string'],
            'county'           => ['sometimes', 'string'],
            'city'             => ['sometimes', 'string'],
            'latitude'         => ['sometimes', 'numeric'],
            'longitude'        => ['sometimes', 'numeric'],
            'timezone'         => ['sometimes', 'string'],

            // Traffic source
            'referer'          => ['sometimes', 'nullable', 'url'],
            'source'           => ['sometimes', 'string'],
            'medium'           => ['sometimes', 'string'],
            'campaign'         => ['sometimes', 'string'],

            // Engagement
            'duration'         => ['sometimes', 'integer'],
            'page_views'       => ['sometimes', 'integer'],
            'scroll_percentage'=> ['sometimes', 'integer'],
            'contact_clicked'  => ['sometimes', 'boolean'],
            'call_clicked'     => ['sometimes', 'boolean'],
            'whatsapp_clicked' => ['sometimes', 'boolean'],
            'email_clicked'    => ['sometimes', 'boolean'],
            'bookmarked'       => ['sometimes', 'boolean'],
            'shared'           => ['sometimes', 'boolean'],
            'scheduled_visit'  => ['sometimes', 'boolean'],

            // Audit
            'visited_at'       => ['sometimes', 'date'],
        ];
    }
}
