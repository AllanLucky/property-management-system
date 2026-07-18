<?php

namespace App\Http\Requests\PropertyVisit;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyVisitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // ✅ Example RBAC check using Spatie Permissions
        // Only allow if user has the "property-visits.create" permission
        return $this->user()?->can('property-visits.create') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'property_id'      => ['required', 'exists:properties,id'],
            'user_id'          => ['nullable', 'exists:users,id'],
            'session_id'       => ['required', 'uuid'],
            'ip_address'       => ['required', 'ip'],
            'user_agent'       => ['required', 'string'],

            // Device & platform
            'device'           => ['required', 'string'],
            'device_type'      => ['required', 'string'],
            'browser'          => ['required', 'string'],
            'browser_version'  => ['nullable', 'string'],
            'platform'         => ['required', 'string'],
            'platform_version' => ['nullable', 'string'],
            'operating_system' => ['required', 'string'],

            // Flags
            'is_mobile'        => ['boolean'],
            'is_tablet'        => ['boolean'],
            'is_desktop'       => ['boolean'],
            'is_robot'         => ['boolean'],
            'is_unique'        => ['boolean'],

            // Location
            'country'          => ['required', 'string'],
            'region'           => ['nullable', 'string'],
            'county'           => ['nullable', 'string'],
            'city'             => ['nullable', 'string'],
            'latitude'         => ['nullable', 'numeric'],
            'longitude'        => ['nullable', 'numeric'],
            'timezone'         => ['nullable', 'string'],

            // Traffic source
            'referer'          => ['nullable', 'url'],
            'source'           => ['required', 'string'],
            'medium'           => ['required', 'string'],
            'campaign'         => ['nullable', 'string'],

            // Engagement
            'duration'         => ['nullable', 'integer'],
            'page_views'       => ['nullable', 'integer'],
            'scroll_percentage'=> ['nullable', 'integer'],
            'contact_clicked'  => ['boolean'],
            'call_clicked'     => ['boolean'],
            'whatsapp_clicked' => ['boolean'],
            'email_clicked'    => ['boolean'],
            'bookmarked'       => ['boolean'],
            'shared'           => ['boolean'],
            'scheduled_visit'  => ['boolean'],

            // Audit
            'visited_at'       => ['required', 'date'],
        ];
    }
}
