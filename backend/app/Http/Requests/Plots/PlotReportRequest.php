<?php


namespace App\Http\Requests\Plots;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlotReportRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Require an authenticated user.
        // Enforce report-specific permissions through your
        // routes, middleware, policies, or controller.
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Date Filters
            |--------------------------------------------------------------------------
            */
            'start_date' => [
                'nullable',
                'date_format:Y-m-d',
                'before_or_equal:end_date',
            ],

            'end_date' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:start_date',
            ],

            'date_from' => [
                'nullable',
                'date_format:Y-m-d',
                'before_or_equal:date_to',
            ],

            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:date_from',
            ],

            /*
            |--------------------------------------------------------------------------
            | Reporting Period
            |--------------------------------------------------------------------------
            */
            'period' => [
                'nullable',
                'string',
                Rule::in([
                    'today',
                    'yesterday',
                    'this_week',
                    'last_week',
                    'this_month',
                    'last_month',
                    'this_quarter',
                    'last_quarter',
                    'this_year',
                    'last_year',
                    'all_time',
                    'custom',
                ]),
            ],

            'group_by' => [
                'nullable',
                'string',
                Rule::in([
                    'day',
                    'week',
                    'month',
                    'quarter',
                    'year',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Pagination
            |--------------------------------------------------------------------------
            */
            'page' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Sorting
            |--------------------------------------------------------------------------
            */
            'sort_by' => [
                'nullable',
                'string',
                Rule::in([
                    'created_at',
                    'updated_at',
                    'code',
                    'title',
                    'size',
                    'asking_price',
                    'status',
                    'sold_at',
                    'sale_date',
                    'amount',
                    'amount_paid',
                    'balance',
                ]),
            ],

            'sort_direction' => [
                'nullable',
                'string',
                Rule::in([
                    'asc',
                    'desc',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Search
            |--------------------------------------------------------------------------
            */
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            /*
            |--------------------------------------------------------------------------
            | Plot Filters
            |--------------------------------------------------------------------------
            */
            'plot_id' => [
                'nullable',
                'integer',
                'exists:plots,id',
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'available',
                    'reserved',
                    'sold',
                    'unavailable',
                ]),
            ],

            'statuses' => [
                'sometimes',
                'array',
                'max:10',
            ],

            'statuses.*' => [
                'required',
                'string',
                'distinct',
                Rule::in([
                    'available',
                    'reserved',
                    'sold',
                    'unavailable',
                ]),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Property Filters
            |--------------------------------------------------------------------------
            */
            'property_id' => [
                'nullable',
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Location Filters
            |--------------------------------------------------------------------------
            */
            'country_id' => [
                'nullable',
                'integer',
                'exists:countries,id',
            ],

            'region_id' => [
                'nullable',
                'integer',
                'exists:regions,id',
            ],

            'county_id' => [
                'nullable',
                'integer',
                'exists:counties,id',
            ],

            'city_id' => [
                'nullable',
                'integer',
                'exists:cities,id',
            ],

            'area_id' => [
                'nullable',
                'integer',
                'exists:areas,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Plot Size Filters
            |--------------------------------------------------------------------------
            */
            'min_size' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'max_size' => [
                'nullable',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'gte:min_size',
            ],

            'size_unit' => [
                'nullable',
                'string',
                Rule::in([
                    'sqm',
                    'sqft',
                    'acre',
                    'hectare',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Asking Price Filters
            |--------------------------------------------------------------------------
            */
            'min_price' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'max_price' => [
                'nullable',
                'numeric',
                'gte:min_price',
                'decimal:0,2',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
                Rule::in([
                    'KES',
                    'UGX',
                    'TZS',
                    'RWF',
                    'NGN',
                    'USD',
                    'EUR',
                    'GBP',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Plot Sale Filters
            |--------------------------------------------------------------------------
            */
            'sale_id' => [
                'nullable',
                'integer',
                'exists:plot_sales,id',
            ],

            'sale_status' => [
                'nullable',
                'string',
                Rule::in([
                    'pending',
                    'reserved',
                    'approved',
                    'completed',
                    'cancelled',
                    'rejected',
                    'expired',
                ]),
            ],

            'sale_statuses' => [
                'sometimes',
                'array',
                'max:10',
            ],

            'sale_statuses.*' => [
                'required',
                'string',
                'distinct',
                Rule::in([
                    'pending',
                    'reserved',
                    'approved',
                    'completed',
                    'cancelled',
                    'rejected',
                    'expired',
                ]),
            ],

            'agent_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'customer_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Filters
            |--------------------------------------------------------------------------
            */
            'payment_id' => [
                'nullable',
                'integer',
                'exists:plot_payments,id',
            ],

            'payment_status' => [
                'nullable',
                'string',
                Rule::in([
                    'pending',
                    'partial',
                    'paid',
                    'failed',
                    'refunded',
                    'overdue',
                ]),
            ],

            'payment_statuses' => [
                'sometimes',
                'array',
                'max:10',
            ],

            'payment_statuses.*' => [
                'required',
                'string',
                'distinct',
                Rule::in([
                    'pending',
                    'partial',
                    'paid',
                    'failed',
                    'refunded',
                    'overdue',
                ]),
            ],

            'payment_method' => [
                'nullable',
                'string',
                Rule::in([
                    'mpesa',
                    'bank_transfer',
                    'cash',
                    'card',
                    'cheque',
                    'online',
                    'other',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Report Output
            |--------------------------------------------------------------------------
            */
            'format' => [
                'nullable',
                'string',
                Rule::in([
                    'json',
                    'csv',
                    'xlsx',
                    'pdf',
                ]),
            ],

            'include_deleted' => [
                'sometimes',
                'boolean',
            ],

            'include_inactive' => [
                'sometimes',
                'boolean',
            ],

            'include_details' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_date.date_format' =>
                'The start date must use the YYYY-MM-DD format.',

            'end_date.date_format' =>
                'The end date must use the YYYY-MM-DD format.',

            'start_date.before_or_equal' =>
                'The start date must be before or equal to the end date.',

            'end_date.after_or_equal' =>
                'The end date must be after or equal to the start date.',

            'date_from.before_or_equal' =>
                'The date from value must be before or equal to date to.',

            'date_to.after_or_equal' =>
                'The date to value must be after or equal to date from.',

            'period.in' =>
                'The selected reporting period is invalid.',

            'group_by.in' =>
                'The selected reporting grouping is invalid.',

            'per_page.max' =>
                'Reports cannot return more than 100 records per page.',

            'sort_by.in' =>
                'The selected sorting field is not supported.',

            'sort_direction.in' =>
                'Sort direction must be asc or desc.',

            'plot_id.exists' =>
                'The selected plot does not exist.',

            'property_id.exists' =>
                'The selected property does not exist.',

            'county_id.exists' =>
                'The selected county does not exist.',

            'city_id.exists' =>
                'The selected city does not exist.',

            'area_id.exists' =>
                'The selected area does not exist.',

            'statuses.array' =>
                'Plot statuses must be provided as a list.',

            'statuses.*.distinct' =>
                'Duplicate plot statuses are not allowed.',

            'statuses.*.in' =>
                'One or more plot statuses are invalid.',

            'max_size.gte' =>
                'The maximum plot size must be greater than or equal to the minimum size.',

            'max_price.gte' =>
                'The maximum price must be greater than or equal to the minimum price.',

            'sale_id.exists' =>
                'The selected plot sale does not exist.',

            'sale_status.in' =>
                'The selected sale status is invalid.',

            'sale_statuses.*.distinct' =>
                'Duplicate sale statuses are not allowed.',

            'agent_id.exists' =>
                'The selected agent does not exist.',

            'customer_id.exists' =>
                'The selected customer does not exist.',

            'payment_id.exists' =>
                'The selected plot payment does not exist.',

            'payment_status.in' =>
                'The selected payment status is invalid.',

            'payment_statuses.*.distinct' =>
                'Duplicate payment statuses are not allowed.',

            'payment_method.in' =>
                'The selected payment method is invalid.',

            'format.in' =>
                'The report format must be json, csv, xlsx, or pdf.',

            'include_deleted.boolean' =>
                'The include deleted option must be true or false.',

            'include_inactive.boolean' =>
                'The include inactive option must be true or false.',

            'include_details.boolean' =>
                'The include details option must be true or false.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'start_date' => 'start date',
            'end_date' => 'end date',
            'date_from' => 'date from',
            'date_to' => 'date to',
            'group_by' => 'grouping interval',
            'per_page' => 'records per page',
            'sort_by' => 'sorting field',
            'sort_direction' => 'sort direction',
            'plot_id' => 'plot',
            'property_id' => 'property',
            'country_id' => 'country',
            'region_id' => 'region',
            'county_id' => 'county',
            'city_id' => 'city',
            'area_id' => 'area',
            'min_size' => 'minimum plot size',
            'max_size' => 'maximum plot size',
            'min_price' => 'minimum asking price',
            'max_price' => 'maximum asking price',
            'sale_id' => 'plot sale',
            'agent_id' => 'agent',
            'customer_id' => 'customer',
            'payment_id' => 'plot payment',
            'payment_method' => 'payment method',
            'include_deleted' => 'include deleted plots',
            'include_inactive' => 'include inactive plots',
            'include_details' => 'include report details',
        ];
    }
}
