<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk and various cloud-based disks
    | are available for your application's file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),


    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Configure all filesystem disks used by your application.
    |
    | Supported drivers:
    | "local", "ftp", "sftp", "s3", "cloudinary"
    |
    */

    'disks' => [

        /*
        |--------------------------------------------------------------------------
        | Local Storage
        |--------------------------------------------------------------------------
        */
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],


        /*
        |--------------------------------------------------------------------------
        | Public Storage
        |--------------------------------------------------------------------------
        */
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/') . '/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],


        /*
        |--------------------------------------------------------------------------
        | Amazon S3 Storage
        |--------------------------------------------------------------------------
        */
        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env(
                'AWS_USE_PATH_STYLE_ENDPOINT',
                false
            ),
            'throw' => false,
            'report' => false,
        ],


        /*
        |--------------------------------------------------------------------------
        | Cloudinary Storage
        |--------------------------------------------------------------------------
        |
        | Used by Cloudinary Laravel package v3.x for image uploads,
        | transformations, and media management.
        |
        */
        'cloudinary' => [
            'driver' => 'cloudinary',

            'cloud' => env('CLOUDINARY_CLOUD_NAME'),

            'key' => env('CLOUDINARY_API_KEY'),

            'secret' => env('CLOUDINARY_API_SECRET'),

            'secure' => true,

            'throw' => false,

            'report' => false,
        ],

    ],


    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | These links are created when running the
    | `php artisan storage:link` command.
    |
    */

    'links' => [

        public_path('storage') => storage_path('app/public'),

    ],

];