<?php

namespace App\Models;

use App\Models\User;
use App\Models\Property;
use App\Models\Apartment;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PropertyFavorite extends Model
{
    use HasFactory;


    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'property_favorites';


    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'user_id',
        'property_id',
        'apartment_id',
        'unit_id',
        'is_active',
    ];


    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'is_active' => 'boolean',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];


    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'property_title',
        'property_slug',
        'property_thumbnail',
    ];



    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */


    /**
     * User who favorited the property
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }



    /**
     * Favorite property
     */
    public function property()
    {
        return $this->belongsTo(Property::class);
    }



    /**
     * Optional apartment
     */
    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }



    /**
     * Optional unit
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }



    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */


    /**
     * Favorites by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }



    /**
     * Favorites by property
     */
    public function scopeByProperty($query, int $propertyId)
    {
        return $query->where('property_id', $propertyId);
    }



    /**
     * Active favorites only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }



    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */


    /**
     * Property title
     */
    public function getPropertyTitleAttribute(): ?string
    {
        return $this->property?->title;
    }



    /**
     * Property slug
     */
    public function getPropertySlugAttribute(): ?string
    {
        return $this->property?->slug;
    }



    /**
     * Property thumbnail
     */
    public function getPropertyThumbnailAttribute(): ?string
    {
        return $this->property?->thumbnail_url;
    }



    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */


    /**
     * Check if user already favorited property
     */
    public static function isFavorited(
        int $userId,
        int $propertyId
    ): bool {

        return static::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->where('is_active', true)
            ->exists();
    }



    /**
     * Toggle favorite status
     */
    public static function toggle(
        int $userId,
        int $propertyId
    ): bool {

        $favorite = static::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->first();


        if ($favorite) {

            $favorite->update([
                'is_active' => !$favorite->is_active,
            ]);

            return $favorite->is_active;
        }


        static::create([
            'user_id'     => $userId,
            'property_id' => $propertyId,
            'is_active'   => true,
        ]);


        return true;
    }
}