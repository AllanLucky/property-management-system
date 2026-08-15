<?php

namespace App\Models;

use App\Models\User;
use App\Models\Unit;
use App\Models\Amenity;
use App\Models\Apartment;
use App\Models\Country;
use App\Models\Region;
use App\Models\County;
use App\Models\City;
use App\Models\Area;
use App\Models\PropertyType;
use App\Models\PropertyReview;
use App\Models\PropertyFeature;
use App\Models\PropertyCategory;
use App\Models\PropertyFavorite;
use App\Models\PropertyVisit;
use App\Models\PropertyAnalytics;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Property extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'properties';

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($property) {

            /*
            |--------------------------------------------------------------------------
            | GENERATE UNIQUE SLUG
            |--------------------------------------------------------------------------
            */

            if (empty($property->slug)) {

                $baseSlug = Str::slug(
                    $property->title ?? 'property'
                );

                $slug = $baseSlug;
                $count = 1;

                while (static::where('slug', $slug)->exists()) {
                    $slug = "{$baseSlug}-{$count}";
                    $count++;
                }

                $property->slug = $slug;
            }

            /*
            |--------------------------------------------------------------------------
            | GENERATE PROPERTY CODE
            |--------------------------------------------------------------------------
            */

            if (empty($property->property_code)) {

                do {

                    $code = 'PR-' .
                        now()->format('Ymd') .
                        '-' .
                        strtoupper(Str::random(6));

                } while (
                    static::where('property_code', $code)->exists()
                );

                $property->property_code = $code;
            }

            /*
            |--------------------------------------------------------------------------
            | LOCATION SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | Automatically populate the *_name fields from the selected
            | location relationships when possible.
            |
            */

            $property->syncLocationSnapshot();
        });

        /*
        |--------------------------------------------------------------------------
        | UPDATE LOCATION SNAPSHOT
        |--------------------------------------------------------------------------
        */

        static::updating(function ($property) {

            if (
                $property->isDirty([
                    'country_id',
                    'region_id',
                    'county_id',
                    'city_id',
                    'area_id',
                ])
            ) {
                $property->syncLocationSnapshot();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    protected $fillable = [

        /*
        |--------------------------------------------------------------------------
        | OWNER
        |--------------------------------------------------------------------------
        */

        'user_id',

        /*
        |--------------------------------------------------------------------------
        | PROPERTY TYPE
        |--------------------------------------------------------------------------
        */

        'property_type_id',
        'property_category_id',

        /*
        |--------------------------------------------------------------------------
        | LOCATION IDS
        |--------------------------------------------------------------------------
        */

        'country_id',
        'region_id',
        'county_id',
        'city_id',
        'area_id',

        /*
        |--------------------------------------------------------------------------
        | LOCATION SNAPSHOT
        |--------------------------------------------------------------------------
        */

        'country_name',
        'region_name',
        'county_name',
        'city_name',
        'area_name',
        'street_address',

        /*
        |--------------------------------------------------------------------------
        | BASIC INFORMATION
        |--------------------------------------------------------------------------
        */

        'title',
        'slug',
        'property_code',
        'description',

        /*
        |--------------------------------------------------------------------------
        | LISTING
        |--------------------------------------------------------------------------
        */

        'listing_type',
        'status',

        /*
        |--------------------------------------------------------------------------
        | MAP LOCATION
        |--------------------------------------------------------------------------
        */

        'latitude',
        'longitude',

        /*
        |--------------------------------------------------------------------------
        | PROPERTY DETAILS
        |--------------------------------------------------------------------------
        */

        'bedrooms',
        'bathrooms',
        'toilets',
        'garages',
        'parking_spaces',
        'floors',

        /*
        |--------------------------------------------------------------------------
        | SIZE
        |--------------------------------------------------------------------------
        */

        'size',
        'size_unit',

        /*
        |--------------------------------------------------------------------------
        | PRICING
        |--------------------------------------------------------------------------
        */

        'price',
        'discount_price',
        'monthly_rent',
        'service_charge',

        /*
        |--------------------------------------------------------------------------
        | STATUS FLAGS
        |--------------------------------------------------------------------------
        */

        'is_featured',
        'is_verified',
        'is_published',

        /*
        |--------------------------------------------------------------------------
        | PROPERTY FEATURES
        |--------------------------------------------------------------------------
        */

        'has_balcony',
        'has_swimming_pool',
        'has_garden',
        'has_wifi',
        'has_security',

        /*
        |--------------------------------------------------------------------------
        | MEDIA
        |--------------------------------------------------------------------------
        */

        'image',
        'thumbnail',
        'video_url',
        'virtual_tour_url',

        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        'meta_title',
        'meta_description',
        'meta_keywords',

        /*
        |--------------------------------------------------------------------------
        | COUNTERS
        |--------------------------------------------------------------------------
        */

        'views_count',
        'favorites_count',

        /*
        |--------------------------------------------------------------------------
        | PUBLISHING
        |--------------------------------------------------------------------------
        */

        'published_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [

        /*
        |--------------------------------------------------------------------------
        | MONEY
        |--------------------------------------------------------------------------
        */

        'price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'monthly_rent' => 'decimal:2',
        'service_charge' => 'decimal:2',

        /*
        |--------------------------------------------------------------------------
        | SIZE
        |--------------------------------------------------------------------------
        */

        'size' => 'decimal:2',

        /*
        |--------------------------------------------------------------------------
        | COORDINATES
        |--------------------------------------------------------------------------
        */

        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',

        /*
        |--------------------------------------------------------------------------
        | BOOLEAN FLAGS
        |--------------------------------------------------------------------------
        */

        'is_featured' => 'boolean',
        'is_verified' => 'boolean',
        'is_published' => 'boolean',

        'has_balcony' => 'boolean',
        'has_swimming_pool' => 'boolean',
        'has_garden' => 'boolean',
        'has_wifi' => 'boolean',
        'has_security' => 'boolean',

        /*
        |--------------------------------------------------------------------------
        | INTEGER COUNTERS
        |--------------------------------------------------------------------------
        */

        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'toilets' => 'integer',
        'garages' => 'integer',
        'parking_spaces' => 'integer',
        'floors' => 'integer',

        'views_count' => 'integer',
        'favorites_count' => 'integer',

        /*
        |--------------------------------------------------------------------------
        | DATES
        |--------------------------------------------------------------------------
        */

        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $appends = [

        /*
        |--------------------------------------------------------------------------
        | PROPERTY
        |--------------------------------------------------------------------------
        */

        'formatted_price',
        'display_price',
        'full_location',
        'thumbnail_url',

        /*
        |--------------------------------------------------------------------------
        | RELATIONSHIP NAMES
        |--------------------------------------------------------------------------
        */

        'type_name',
        'category_name',

        /*
        |--------------------------------------------------------------------------
        | REVIEW ANALYTICS
        |--------------------------------------------------------------------------
        */

        'average_rating',
        'reviews_count',
        'rating_breakdown',

        /*
        |--------------------------------------------------------------------------
        | VISIT ANALYTICS
        |--------------------------------------------------------------------------
        */

        'visits_count',
        'unique_visits_count',

        /*
        |--------------------------------------------------------------------------
        | UNIT ANALYTICS
        |--------------------------------------------------------------------------
        */

        'vacant_units_count',
        'occupied_units_count',
    ];

    /*
    |--------------------------------------------------------------------------
    | ROUTE MODEL BINDING
    |--------------------------------------------------------------------------
    */

    public function getRouteKeyName()
    {
        return 'slug';
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Property owner / creator.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Property type.
     */
    public function propertyType()
    {
        return $this->belongsTo(PropertyType::class);
    }

    /**
     * Property category.
     */
    public function propertyCategory()
    {
        return $this->belongsTo(PropertyCategory::class);
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Property country.
     */
    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Property region.
     */
    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Property county.
     */
    public function county()
    {
        return $this->belongsTo(County::class);
    }

    /**
     * Property city.
     */
    public function city()
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Property area.
     */
    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY STRUCTURE
    |--------------------------------------------------------------------------
    */

    /**
     * Apartments belonging to the property.
     */
    public function apartments()
    {
        return $this->hasMany(Apartment::class);
    }

    /**
     * Units belonging directly to the property.
     */
    public function units()
    {
        return $this->hasMany(Unit::class);
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY REVIEWS
    |--------------------------------------------------------------------------
    */

    /**
     * All property reviews.
     */
    public function reviews()
    {
        return $this->hasMany(PropertyReview::class)
            ->latest();
    }

    /**
     * Published reviews.
     */
    public function publishedReviews()
    {
        return $this->hasMany(PropertyReview::class)
            ->published()
            ->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY VISITS
    |--------------------------------------------------------------------------
    */

    /**
     * Property visits.
     */
    public function visits()
    {
        return $this->hasMany(PropertyVisit::class)
            ->latest('visited_at');
    }

    /**
     * Unique property visits.
     */
    public function uniqueVisits()
    {
        return $this->hasMany(PropertyVisit::class)
            ->unique();
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY FAVORITES
    |--------------------------------------------------------------------------
    */

    /**
     * Property favorites.
     */
    public function favorites()
    {
        return $this->hasMany(PropertyFavorite::class);
    }

    /**
     * Users who favorited this property.
     */
    public function favoritedByUsers()
    {
        return $this->belongsToMany(
            User::class,
            'property_favorites',
            'property_id',
            'user_id'
        )->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY ANALYTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Property analytics snapshots.
     */
    public function analytics()
    {
        return $this->hasMany(PropertyAnalytics::class);
    }

    /**
     * Latest analytics snapshot.
     */
    public function latestAnalytics()
    {
        return $this->hasOne(PropertyAnalytics::class)
            ->latestOfMany('snapshot_date');
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY FEATURES
    |--------------------------------------------------------------------------
    */

    /**
     * All property features.
     */
    public function features()
    {
        return $this->belongsToMany(
            PropertyFeature::class,
            'property_feature_property',
            'property_id',
            'property_feature_id'
        )
        ->withPivot([
            'value',
            'note',
            'is_active',
            'sort_order',
        ])
        ->withTimestamps()
        ->orderByPivot('sort_order');
    }

    /**
     * Active property features.
     */
    public function activeFeatures()
    {
        return $this->features()
            ->wherePivot('is_active', true);
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY AMENITIES
    |--------------------------------------------------------------------------
    */

    /**
     * All property amenities.
     */
    public function amenities()
    {
        return $this->belongsToMany(
            Amenity::class,
            'property_amenities',
            'property_id',
            'amenity_id'
        )
        ->withPivot([
            'is_available',
            'distance',
            'walking_minutes',
            'note',
        ])
        ->withTimestamps();
    }

    /**
     * Available amenities only.
     */
    public function availableAmenities()
    {
        return $this->amenities()
            ->wherePivot('is_available', true);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Published properties.
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Featured properties.
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Verified properties.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Properties for sale.
     */
    public function scopeForSale($query)
    {
        return $query->where('listing_type', 'sale');
    }

    /**
     * Properties for rent.
     */
    public function scopeForRent($query)
    {
        return $query->where('listing_type', 'rent');
    }

    /**
     * Properties for lease.
     */
    public function scopeForLease($query)
    {
        return $query->where('listing_type', 'lease');
    }

    /**
     * Latest properties.
     */
    public function scopeLatest($query)
    {
        return $query->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Properties by country.
     */
    public function scopeInCountry($query, $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    /**
     * Properties by region.
     */
    public function scopeInRegion($query, $regionId)
    {
        return $query->where('region_id', $regionId);
    }

    /**
     * Properties by county.
     */
    public function scopeInCounty($query, $countyId)
    {
        return $query->where('county_id', $countyId);
    }

    /**
     * Properties by city.
     */
    public function scopeInCity($query, $cityId)
    {
        return $query->where('city_id', $cityId);
    }

    /**
     * Properties by area.
     */
    public function scopeInArea($query, $areaId)
    {
        return $query->where('area_id', $areaId);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Formatted sale price.
     */
    public function getFormattedPriceAttribute()
    {
        return 'KES ' . number_format(
            $this->price ?? 0,
            2
        );
    }

    /**
     * Display property price.
     */
    public function getDisplayPriceAttribute()
    {
        if ($this->listing_type === 'rent') {
            return 'KES ' .
                number_format(
                    $this->monthly_rent ?? 0,
                    2
                ) .
                ' / month';
        }

        if ($this->listing_type === 'lease') {
            return 'KES ' .
                number_format(
                    $this->monthly_rent ?? $this->price ?? 0,
                    2
                ) .
                ' / month';
        }

        return 'KES ' .
            number_format(
                $this->discount_price ?? $this->price ?? 0,
                2
            );
    }

    /**
     * Full property location.
     */
    public function getFullLocationAttribute()
    {
        return collect([
            $this->street_address,
            $this->area_name,
            $this->city_name,
            $this->county_name,
            $this->region_name,
            $this->country_name,
        ])
        ->filter(fn ($value) => filled($value))
        ->implode(', ');
    }

    /**
     * Property type name.
     */
    public function getTypeNameAttribute()
    {
        return $this->propertyType?->name ?? 'Unknown';
    }

    /**
     * Property category name.
     */
    public function getCategoryNameAttribute()
    {
        return $this->propertyCategory?->name ?? 'Uncategorized';
    }

    /**
     * Property thumbnail URL.
     */
    public function getThumbnailUrlAttribute()
    {
        if (!$this->thumbnail) {
            return asset('images/default-property.jpg');
        }

        if (
            Str::startsWith(
                $this->thumbnail,
                ['http://', 'https://']
            )
        ) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Synchronize location snapshot names from relationships.
     *
     * The *_id columns remain the source relationships while the
     * *_name columns preserve a convenient display snapshot.
     */
    public function syncLocationSnapshot(): void
    {
        if ($this->country_id) {
            $country = $this->country()->first();

            if ($country) {
                $this->country_name = $country->name;
            }
        }

        if ($this->region_id) {
            $region = $this->region()->first();

            if ($region) {
                $this->region_name = $region->name;
            }
        }

        if ($this->county_id) {
            $county = $this->county()->first();

            if ($county) {
                $this->county_name = $county->name;
            }
        }

        if ($this->city_id) {
            $city = $this->city()->first();

            if ($city) {
                $this->city_name = $city->name;
            }
        }

        if ($this->area_id) {
            $area = $this->area()->first();

            if ($area) {
                $this->area_name = $area->name;
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEW STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Average rating.
     */
    public function getAverageRatingAttribute(): float
    {
        if ($this->relationLoaded('reviews')) {

            $reviews = $this->reviews
                ->where('is_published', true);

            return round(
                $reviews->avg('rating') ?? 0,
                1
            );
        }

        return round(
            $this->reviews()
                ->published()
                ->avg('rating') ?? 0,
            1
        );
    }

    /**
     * Total published reviews.
     */
    public function getReviewsCountAttribute(): int
    {
        if ($this->relationLoaded('reviews')) {

            return $this->reviews
                ->where('is_published', true)
                ->count();
        }

        return $this->reviews()
            ->published()
            ->count();
    }

    /**
     * Rating breakdown.
     */
    public function getRatingBreakdownAttribute(): array
    {
        $ratings = [
            5 => 0,
            4 => 0,
            3 => 0,
            2 => 0,
            1 => 0,
        ];

        if ($this->relationLoaded('reviews')) {

            foreach (
                $this->reviews->where('is_published', true)
                as $review
            ) {
                $rating = (int) $review->rating;

                if (isset($ratings[$rating])) {
                    $ratings[$rating]++;
                }
            }

            return $ratings;
        }

        $results = $this->reviews()
            ->published()
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        foreach ($results as $rating => $count) {
            $ratings[(int) $rating] = (int) $count;
        }

        return $ratings;
    }

    /*
    |--------------------------------------------------------------------------
    | VISIT STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Total visits.
     */
    public function getVisitsCountAttribute(): int
    {
        if ($this->relationLoaded('visits')) {
            return $this->visits->count();
        }

        return $this->visits()->count();
    }

    /**
     * Unique visits.
     */
    public function getUniqueVisitsCountAttribute(): int
    {
        if ($this->relationLoaded('visits')) {

            return $this->visits
                ->where('is_unique', true)
                ->count();
        }

        return $this->visits()
            ->unique()
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Vacant units.
     */
    public function getVacantUnitsCountAttribute(): int
    {
        return $this->relationLoaded('units')
            ? $this->units
                ->where('status', 'vacant')
                ->count()
            : $this->units()
                ->where('status', 'vacant')
                ->count();
    }

    /**
     * Occupied units.
     */
    public function getOccupiedUnitsCountAttribute(): int
    {
        return $this->relationLoaded('units')
            ? $this->units
                ->where('status', 'occupied')
                ->count()
            : $this->units()
                ->where('status', 'occupied')
                ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Increment property views.
     */
    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment favorites.
     */
    public function incrementFavorites(): void
    {
        $this->increment('favorites_count');
    }

    /**
     * Decrement favorites.
     */
    public function decrementFavorites(): void
    {
        if ($this->favorites_count > 0) {
            $this->decrement('favorites_count');
        }
    }

    /**
     * Determine if property is available for sale.
     */
    public function isForSale(): bool
    {
        return $this->listing_type === 'sale';
    }

    /**
     * Determine if property is available for rent.
     */
    public function isForRent(): bool
    {
        return $this->listing_type === 'rent';
    }

    /**
     * Determine if property is available for lease.
     */
    public function isForLease(): bool
    {
        return $this->listing_type === 'lease';
    }

    /*
    |--------------------------------------------------------------------------
    | VISIT PERIOD STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Total visits today.
     */
    public function getTodayVisitsCount(): int
    {
        return $this->visits()
            ->today()
            ->count();
    }

    /**
     * Total visits this week.
     */
    public function getThisWeekVisitsCount(): int
    {
        return $this->visits()
            ->thisWeek()
            ->count();
    }

    /**
     * Total visits this month.
     */
    public function getThisMonthVisitsCount(): int
    {
        return $this->visits()
            ->thisMonth()
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEW PERCENTAGES
    |--------------------------------------------------------------------------
    */

    /**
     * Five-star review percentage.
     */
    public function getFiveStarPercentageAttribute(): float
    {
        if ($this->reviews_count === 0) {
            return 0;
        }

        return round(
            (($this->rating_breakdown[5] ?? 0) /
                $this->reviews_count) * 100,
            2
        );
    }

    /**
     * Four-star review percentage.
     */
    public function getFourStarPercentageAttribute(): float
    {
        if ($this->reviews_count === 0) {
            return 0;
        }

        return round(
            (($this->rating_breakdown[4] ?? 0) /
                $this->reviews_count) * 100,
            2
        );
    }

    /**
     * Three-star review percentage.
     */
    public function getThreeStarPercentageAttribute(): float
    {
        if ($this->reviews_count === 0) {
            return 0;
        }

        return round(
            (($this->rating_breakdown[3] ?? 0) /
                $this->reviews_count) * 100,
            2
        );
    }

    /**
     * Two-star review percentage.
     */
    public function getTwoStarPercentageAttribute(): float
    {
        if ($this->reviews_count === 0) {
            return 0;
        }

        return round(
            (($this->rating_breakdown[2] ?? 0) /
                $this->reviews_count) * 100,
            2
        );
    }

    /**
     * One-star review percentage.
     */
    public function getOneStarPercentageAttribute(): float
    {
        if ($this->reviews_count === 0) {
            return 0;
        }

        return round(
            (($this->rating_breakdown[1] ?? 0) /
                $this->reviews_count) * 100,
            2
        );
    }

    /**
     * Recommendation percentage.
     */
    public function getRecommendationPercentageAttribute(): float
    {
        $total = $this->reviews()
            ->published()
            ->count();

        if ($total === 0) {
            return 0;
        }

        $recommended = $this->reviews()
            ->published()
            ->where('would_recommend', true)
            ->count();

        return round(
            ($recommended / $total) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLISHING
    |--------------------------------------------------------------------------
    */

    /**
     * Publish property.
     */
    public function publish(): bool
    {
        return $this->update([
            'status' => 'published',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }

    /**
     * Unpublish property.
     */
    public function unpublish(): bool
    {
        return $this->update([
            'is_published' => false,
            'published_at' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FEATURED
    |--------------------------------------------------------------------------
    */

    /**
     * Mark property as featured.
     */
    public function markAsFeatured(): bool
    {
        return $this->update([
            'is_featured' => true,
        ]);
    }

    /**
     * Remove featured status.
     */
    public function removeFeatured(): bool
    {
        return $this->update([
            'is_featured' => false,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFICATION
    |--------------------------------------------------------------------------
    */

    /**
     * Verify property.
     */
    public function verify(): bool
    {
        return $this->update([
            'is_verified' => true,
        ]);
    }

    /**
     * Unverify property.
     */
    public function unverify(): bool
    {
        return $this->update([
            'is_verified' => false,
        ]);
    }
}
