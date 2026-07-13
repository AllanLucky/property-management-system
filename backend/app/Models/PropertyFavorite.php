<?php

namespace App\Models;

use App\Models\User;
use App\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PropertyFavorite extends Model
{
    use HasFactory;

    /*
    |------------------------------------------
    | TABLE
    |------------------------------------------
    */
    protected $table = 'property_favorites';

    /*
    |------------------------------------------
    | FILLABLE
    |------------------------------------------
    */
    protected $fillable = [
        'user_id',
        'property_id',
    ];

    /*
    |------------------------------------------
    | CASTS
    |------------------------------------------
    */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |------------------------------------------
    | APPENDS
    |------------------------------------------
    */
    protected $appends = [
        'property_title',
        'property_slug',
        'property_thumbnail',
    ];

    /*
    |------------------------------------------
    | RELATIONSHIPS
    |------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /*
    |------------------------------------------
    | SCOPES
    |------------------------------------------
    */

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByProperty($query, int $propertyId)
    {
        return $query->where('property_id', $propertyId);
    }

    /*
    |------------------------------------------
    | ACCESSORS
    |------------------------------------------
    */

    public function getPropertyTitleAttribute(): ?string
    {
        return $this->property?->title;
    }

    public function getPropertySlugAttribute(): ?string
    {
        return $this->property?->slug;
    }

    public function getPropertyThumbnailAttribute(): ?string
    {
        return $this->property?->thumbnail_url;
    }

    /*
    |------------------------------------------
    | HELPERS (READ-ONLY SAFETY VERSION)
    |------------------------------------------
    */

    public static function isFavorited(int $userId, int $propertyId): bool
    {
        return static::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->exists();
    }
}