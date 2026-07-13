<?php

return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | ENV-BASED ORIGINS (PROFESSIONAL APPROACH)
    |--------------------------------------------------------------------------
    */
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    /*
    |--------------------------------------------------------------------------
    | SECURITY HARDENED HEADERS
    |--------------------------------------------------------------------------
    */
    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
    ],

    'exposed_headers' => [
        'Authorization',
    ],

    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | SANCTUM SUPPORT (IMPORTANT)
    |--------------------------------------------------------------------------
    */
    'supports_credentials' => true,
];