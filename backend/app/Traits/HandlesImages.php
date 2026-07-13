<?php

namespace App\Traits;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

trait HandlesImages
{
    /*
    |--------------------------------------------------------------------------
    | ALLOWED MIME TYPES
    |--------------------------------------------------------------------------
    */
    protected array $allowedImageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/gif',
    ];

    /*
    |--------------------------------------------------------------------------
    | MAX IMAGE SIZE (5MB)
    |--------------------------------------------------------------------------
    */
    protected int $maxImageSize = 5_242_880;

    /*
    |--------------------------------------------------------------------------
    | VALIDATE IMAGE
    |--------------------------------------------------------------------------
    */
    protected function validateImage(
        UploadedFile $file
    ): bool {

        if (!$file->isValid()) {
            return false;
        }

        if (
            !in_array(
                $file->getMimeType(),
                $this->allowedImageMimeTypes
            )
        ) {
            return false;
        }

        if ($file->getSize() > $this->maxImageSize) {
            return false;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD SINGLE IMAGE
    |--------------------------------------------------------------------------
    */
    public function uploadImage(
        UploadedFile $file,
        string $folder = 'uploads'
    ): ?array {

        try {

            if (!$this->validateImage($file)) {
                return null;
            }

            $publicId = $folder . '/' . Str::uuid();

            $uploadedFile = Cloudinary::upload(
                $file->getRealPath(),
                [
                    'folder' => $folder,
                    'public_id' => $publicId,
                    'resource_type' => 'image',
                    'overwrite' => true,
                ]
            );

            return [
                'url' => $uploadedFile->getSecurePath(),
                'public_id' => $uploadedFile->getPublicId(),
            ];

        } catch (Exception $e) {

            report($e);

            Log::error('Image upload failed', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REPLACE IMAGE
    |--------------------------------------------------------------------------
    */
    public function replaceImage(
        UploadedFile $newFile,
        ?string $oldPublicId,
        string $folder = 'uploads'
    ): ?array {

        try {

            if (!empty($oldPublicId)) {
                $this->deleteImage($oldPublicId);
            }

            return $this->uploadImage(
                $newFile,
                $folder
            );

        } catch (Exception $e) {

            report($e);

            Log::error('Image replacement failed', [
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE
    |--------------------------------------------------------------------------
    */
    public function deleteImage(
        ?string $publicId
    ): bool {

        if (empty($publicId)) {
            return false;
        }

        try {

            Cloudinary::destroy($publicId);

            return true;

        } catch (Exception $e) {

            report($e);

            Log::error('Image deletion failed', [
                'message' => $e->getMessage(),
                'public_id' => $publicId,
            ]);

            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */
    public function uploadMultipleImages(
        array $files,
        string $folder = 'uploads'
    ): array {

        $uploadedImages = [];

        foreach ($files as $file) {

            if (
                $file instanceof UploadedFile
                && $this->validateImage($file)
            ) {

                $upload = $this->uploadImage(
                    $file,
                    $folder
                );

                if ($upload) {
                    $uploadedImages[] = $upload;
                }
            }
        }

        return $uploadedImages;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */
    public function deleteMultipleImages(
        array $publicIds
    ): bool {

        try {

            foreach ($publicIds as $publicId) {

                if (!empty($publicId)) {
                    $this->deleteImage($publicId);
                }
            }

            return true;

        } catch (Exception $e) {

            report($e);

            Log::error('Multiple image deletion failed', [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC MULTIPLE IMAGES
    |--------------------------------------------------------------------------
    */
    public function syncImages(
        array $newFiles,
        array $oldPublicIds = [],
        string $folder = 'uploads'
    ): array {

        if (!empty($oldPublicIds)) {
            $this->deleteMultipleImages($oldPublicIds);
        }

        return $this->uploadMultipleImages(
            $newFiles,
            $folder
        );
    }
}