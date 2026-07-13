<?php

/*
 * This file is part of the Laravel Cloudinary package.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Notification URL
    |--------------------------------------------------------------------------
    |
    | An HTTP or HTTPS URL to notify your application when uploads, deletes,
    | and other asynchronous Cloudinary API operations are completed.
    |
    */
    'notification_url' => env('CLOUDINARY_NOTIFICATION_URL'),


    /*
    |--------------------------------------------------------------------------
    | Cloudinary Connection URL
    |--------------------------------------------------------------------------
    |
    | Cloudinary v3 configuration. You can either provide a complete
    | CLOUDINARY_URL or allow Laravel to generate it from:
    |
    | CLOUDINARY_CLOUD_NAME
    | CLOUDINARY_API_KEY
    | CLOUDINARY_API_SECRET
    |
    */
    'cloud_url' => env(
        'CLOUDINARY_URL',
        sprintf(
            'cloudinary://%s:%s@%s',
            env('CLOUDINARY_API_KEY'),
            env('CLOUDINARY_API_SECRET'),
            env('CLOUDINARY_CLOUD_NAME')
        )
    ),


    /*
    |--------------------------------------------------------------------------
    | Upload Preset
    |--------------------------------------------------------------------------
    |
    | Optional upload preset configured in your Cloudinary dashboard.
    |
    */
    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),


    /*
    |--------------------------------------------------------------------------
    | Upload Widget Route
    |--------------------------------------------------------------------------
    */
    'upload_route' => env('CLOUDINARY_UPLOAD_ROUTE'),


    /*
    |--------------------------------------------------------------------------
    | Upload Widget Controller Action
    |--------------------------------------------------------------------------
    */
    'upload_action' => env('CLOUDINARY_UPLOAD_ACTION'),
];