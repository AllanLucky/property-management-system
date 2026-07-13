<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ImageService
{
    /*
    |--------------------------------------------------------------------------
    | IMAGE CONFIGURATION
    |--------------------------------------------------------------------------
    */
    protected array $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
    ];

    protected array $allowedExtensions = [
        'jpg',
        'jpeg',
        'png',
        'webp',
        'gif',
    ];

    protected int $maxFileSize = 5 * 1024 * 1024; // 5 MB


    /*
    |--------------------------------------------------------------------------
    | VALIDATE IMAGE
    |--------------------------------------------------------------------------
    */
    protected function validateImage(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new Exception('Uploaded file is invalid.');
        }

        $mime = $file->getMimeType();
        $extension = strtolower($file->getClientOriginalExtension());
        $size = $file->getSize();

        if (!$mime || !in_array($mime, $this->allowedMimeTypes, true)) {
            throw new Exception(
                "Unsupported image MIME type: {$mime}"
            );
        }

        if (!in_array($extension, $this->allowedExtensions, true)) {
            throw new Exception(
                "Unsupported image extension: {$extension}"
            );
        }

        if ($size > $this->maxFileSize) {
            throw new Exception(
                "Image exceeds maximum size of 5MB."
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD SINGLE IMAGE
    |--------------------------------------------------------------------------
    */
    public function upload(
        UploadedFile $file,
        string $folder = 'uploads'
    ): array {
        try {

            $this->validateImage($file);

            $publicId = (string) Str::uuid();


            Log::info('Starting Cloudinary upload', [
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'folder' => $folder,
            ]);


            $response = Cloudinary::uploadApi()->upload(
                $file->getRealPath(),
                [
                    'folder' => $folder,
                    'public_id' => $publicId,
                    'resource_type' => 'image',
                    'overwrite' => true,
                    'quality' => 'auto',
                    'fetch_format' => 'auto',
                ]
            );


            if (
                empty($response) ||
                empty($response['secure_url'])
            ) {
                throw new Exception(
                    'Cloudinary returned an empty image URL.'
                );
            }


            Log::info('Cloudinary upload successful', [
                'public_id' => $response['public_id'] ?? null,
                'url' => $response['secure_url'],
            ]);


            return [
                'url' => $response['secure_url'],
                'public_id' => $response['public_id'] ?? $publicId,
                'width' => $response['width'] ?? null,
                'height' => $response['height'] ?? null,
                'format' => $response['format'] ?? null,
            ];

        } catch (Exception $e) {

            Log::error('Image upload failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */
    public function uploadMany(
        array $files,
        string $folder = 'uploads'
    ): array {
        $images = [];

        foreach ($files as $file) {

            if (!$file instanceof UploadedFile) {
                continue;
            }

            try {
                $images[] = $this->upload(
                    $file,
                    $folder
                );

            } catch (Exception $e) {
                Log::warning('Skipping failed image upload', [
                    'message' => $e->getMessage(),
                ]);
            }
        }

        return $images;
    }


    /*
    |--------------------------------------------------------------------------
    | REPLACE IMAGE SAFELY
    |--------------------------------------------------------------------------
    */
    public function replace(
        UploadedFile $newFile,
        ?string $oldPublicId,
        string $folder = 'uploads'
    ): array {

        $newUpload = $this->upload(
            $newFile,
            $folder
        );


        if (!empty($oldPublicId)) {

            $deleted = $this->delete(
                $oldPublicId
            );


            if (!$deleted) {
                Log::warning(
                    'Old image could not be deleted',
                    [
                        'public_id' => $oldPublicId,
                    ]
                );
            }
        }


        return $newUpload;
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE SINGLE IMAGE
    |--------------------------------------------------------------------------
    */
    public function delete(?string $publicId): bool
    {
        if (empty($publicId)) {
            return true;
        }


        try {

            $result = Cloudinary::uploadApi()->destroy(
                $publicId,
                [
                    'resource_type' => 'image',
                ]
            );


            Log::info('Cloudinary delete response', [
                'public_id' => $publicId,
                'response' => $result,
            ]);


            return true;

        } catch (Exception $e) {

            Log::error('Image deletion failed', [
                'public_id' => $publicId,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return false;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */
    public function deleteMany(
        array $publicIds
    ): bool {

        $success = true;


        foreach (array_filter($publicIds) as $publicId) {

            if (!$this->delete($publicId)) {
                $success = false;
            }
        }


        return $success;
    }


    /*
    |--------------------------------------------------------------------------
    | SYNC IMAGES
    |--------------------------------------------------------------------------
    */
    public function sync(
        array $newFiles,
        array $oldPublicIds = [],
        string $folder = 'uploads'
    ): array {

        $uploads = $this->uploadMany(
            $newFiles,
            $folder
        );


        if (!empty($oldPublicIds)) {
            $this->deleteMany(
                $oldPublicIds
            );
        }


        return $uploads;
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK IF IMAGE EXISTS
    |--------------------------------------------------------------------------
    */
    public function hasImage(
        ?string $url
    ): bool {
        return !empty($url);
    }
}