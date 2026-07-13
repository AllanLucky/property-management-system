<?php

namespace App\Models;

use App\Models\User;
use App\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class PropertyReview extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */
    protected $table = 'property_reviews';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'property_id',
        'user_id',
        'rating',
        'title',
        'comment',
        'would_recommend',
        'is_verified',
        'is_published',
        'likes_count',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'rating'             => 'integer',
        'would_recommend'    => 'boolean',
        'is_verified'        => 'boolean',
        'is_published'       => 'boolean',
        'likes_count'        => 'integer',
        'created_at'         => 'datetime',
        'updated_at'         => 'datetime',
        'published_at'       => 'datetime',
        'edited_at'          => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | DEFAULT EAGER LOADING
    |--------------------------------------------------------------------------
    */
    protected $with = [
        'user:id,first_name,last_name,email,image',
        'property:id,title,slug,thumbnail',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */
    protected $appends = [
        'rating_label',
        'rating_percentage',
        'sentiment',
        'is_positive',
        'is_negative',
        'reviewer_name',
        'reviewer_avatar',
        'short_comment',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('is_verified', true);
    }

    public function scopeRecommended(Builder $query): Builder
    {
        return $query->where('would_recommend', true);
    }

    public function scopePositive(Builder $query): Builder
    {
        return $query->where('rating', '>=', 4);
    }

    public function scopeNeutral(Builder $query): Builder
    {
        return $query->where('rating', 3);
    }

    public function scopeNegative(Builder $query): Builder
    {
        return $query->where('rating', '<=', 2);
    }

    public function scopeRating(Builder $query, int $rating): Builder
    {
        return $query->where('rating', $rating);
    }

    public function scopeLatest(Builder $query): Builder
    {
        return $query->latest();
    }

    public function scopeOldest(Builder $query): Builder
    {
        return $query->oldest();
    }

    public function scopeHighestRated(Builder $query): Builder
    {
        return $query->orderByDesc('rating');
    }

    public function scopeLowestRated(Builder $query): Builder
    {
        return $query->orderBy('rating');
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getIsPositiveAttribute(): bool
    {
        return $this->rating >= 4;
    }

    public function getIsNegativeAttribute(): bool
    {
        return $this->rating <= 2;
    }

    public function getRatingLabelAttribute(): string
    {
        return match ($this->rating) {
            5 => 'Excellent',
            4 => 'Very Good',
            3 => 'Good',
            2 => 'Fair',
            1 => 'Poor',
            default => 'Not Rated',
        };
    }

    public function getRatingPercentageAttribute(): float
    {
        return round(($this->rating / 5) * 100, 2);
    }

    public function getSentimentAttribute(): string
    {
        return match ($this->rating) {
            5 => 'excellent',
            4 => 'positive',
            3 => 'neutral',
            2 => 'negative',
            1 => 'very_negative',
            default => 'unknown',
        };
    }

    public function getReviewerNameAttribute(): ?string
    {
        if (!$this->user) {
            return null;
        }

        return trim($this->user->first_name . ' ' . $this->user->last_name);
    }

    public function getReviewerAvatarAttribute(): ?string
    {
        return $this->user?->image;
    }

    public function getShortCommentAttribute(): ?string
    {
        return $this->comment
            ? Str::limit($this->comment, 120)
            : null;
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    public function isEditable(): bool
    {
        return true;
    }

    public function isDeletable(): bool
    {
        return true;
    }

    public function incrementLikes(): void
    {
        $this->increment('likes_count');
    }

    public function decrementLikes(): void
    {
        if ($this->likes_count > 0) {
            $this->decrement('likes_count');
        }
    }
}