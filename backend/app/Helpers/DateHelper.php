<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    /*
    |--------------------------------------------------------------------------
    | DEFAULT TIMEZONE (IMPORTANT FOR SAAS APPS)
    |--------------------------------------------------------------------------
    */
    protected static string $timezone = 'Africa/Nairobi';

    /*
    |--------------------------------------------------------------------------
    | STANDARD API FORMAT
    |--------------------------------------------------------------------------
    */
    public static function format($date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)
            ->timezone(self::$timezone)
            ->toDateTimeString();
    }

    /*
    |--------------------------------------------------------------------------
    | DATE ONLY FORMAT
    |--------------------------------------------------------------------------
    */
    public static function dateOnly($date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)
            ->timezone(self::$timezone)
            ->format('Y-m-d');
    }

    /*
    |--------------------------------------------------------------------------
    | HUMAN READABLE (UI / FRONTEND)
    |--------------------------------------------------------------------------
    */
    public static function human($date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)
            ->timezone(self::$timezone)
            ->diffForHumans();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK IF DATE IS EXPIRED
    |--------------------------------------------------------------------------
    */
    public static function isExpired($date): bool
    {
        if (!$date) {
            return true;
        }

        return Carbon::parse($date)->isPast();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK IF DATE IS FUTURE
    |--------------------------------------------------------------------------
    */
    public static function isFuture($date): bool
    {
        if (!$date) {
            return false;
        }

        return Carbon::parse($date)->isFuture();
    }

    /*
    |--------------------------------------------------------------------------
    | ADD DAYS
    |--------------------------------------------------------------------------
    */
    public static function addDays(int $days): string
    {
        return Carbon::now()
            ->timezone(self::$timezone)
            ->addDays($days)
            ->toDateTimeString();
    }

    /*
    |--------------------------------------------------------------------------
    | SUBTRACT DAYS
    |--------------------------------------------------------------------------
    */
    public static function subDays(int $days): string
    {
        return Carbon::now()
            ->timezone(self::$timezone)
            ->subDays($days)
            ->toDateTimeString();
    }

    /*
    |--------------------------------------------------------------------------
    | RANGE CHECK (VERY USEFUL FOR BOOKINGS)
    |--------------------------------------------------------------------------
    */
    public static function isBetween($date, $start, $end): bool
    {
        if (!$date || !$start || !$end) {
            return false;
        }

        $date = Carbon::parse($date);
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);

        return $date->between($start, $end);
    }

    /*
    |--------------------------------------------------------------------------
    | DAYS DIFFERENCE (FOR RENT / BOOKINGS)
    |--------------------------------------------------------------------------
    */
    public static function diffInDays($start, $end): int
    {
        if (!$start || !$end) {
            return 0;
        }

        return Carbon::parse($start)
            ->diffInDays(Carbon::parse($end));
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT FOR INPUT FIELDS (FRONTEND FRIENDLY)
    |--------------------------------------------------------------------------
    */
    public static function forInput($date): ?string
    {
        if (!$date) {
            return null;
        }

        return Carbon::parse($date)
            ->timezone(self::$timezone)
            ->format('Y-m-d\TH:i');
    }
}