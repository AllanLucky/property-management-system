<?php

namespace App\Services;

use App\Repositories\Interfaces\UserRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class ProfileService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected ImageService $imageService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET PROFILE
    |--------------------------------------------------------------------------
    */
    public function getProfile(int $userId)
    {
        $user = $this->userRepo->findById($userId);

        if (!$user) {
            throw new ModelNotFoundException("User not found.");
        }

        return $user->fresh()->load(['roles', 'permissions']);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROFILE (TEXT + IMAGE)
    |--------------------------------------------------------------------------
    */
    public function updateProfile(int $userId, array $data)
    {
        return DB::transaction(function () use ($userId, $data) {

            $user = $this->userRepo->findById($userId);

            if (!$user) {
                throw new ModelNotFoundException("User not found.");
            }

            /*
            |----------------------------------------------------------
            | IMAGE HANDLING
            |----------------------------------------------------------
            */
            if (isset($data['image']) && $data['image']) {

                $upload = $this->imageService->replace(
                    $data['image'],
                    $user->image_public_id,
                    'users'
                );

                if (!$upload || empty($upload['url'])) {
                    throw new RuntimeException('Profile image upload failed.');
                }

                $data['image'] = $upload['url'];
                $data['image_public_id'] = $upload['public_id'] ?? null;
            }

            $updatedUser = $this->userRepo->update($userId, $data);

            if (!$updatedUser) {
                throw new RuntimeException('Failed to update profile.');
            }

            return $updatedUser->fresh()->load(['roles', 'permissions']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHANGE PASSWORD
    |--------------------------------------------------------------------------
    */
    public function changePassword(int $userId, string $oldPassword, string $newPassword)
    {
        return DB::transaction(function () use ($userId, $oldPassword, $newPassword) {

            $user = $this->userRepo->findById($userId);

            if (!$user) {
                throw new ModelNotFoundException("User not found.");
            }

            if (!Hash::check($oldPassword, $user->password)) {
                throw new RuntimeException('Current password is incorrect.');
            }

            $updatedUser = $this->userRepo->update($userId, [
                'password' => Hash::make($newPassword),
            ]);

            if (!$updatedUser) {
                throw new RuntimeException('Failed to update password.');
            }

            return $updatedUser->fresh()->load(['roles', 'permissions']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE AVATAR ONLY (FIXED & SAFE)
    |--------------------------------------------------------------------------
    */
    public function updateAvatar(int $userId, $image)
    {
        return DB::transaction(function () use ($userId, $image) {

            $user = $this->userRepo->findById($userId);

            if (!$user) {
                throw new ModelNotFoundException("User not found.");
            }

            if (!$image) {
                throw new RuntimeException("No image provided.");
            }

            $upload = $this->imageService->replace(
                $image,
                $user->image_public_id,
                'users'
            );

            if (!$upload || empty($upload['url'])) {
                throw new RuntimeException('Failed to upload profile image.');
            }

            $updatedUser = $this->userRepo->update($userId, [
                'image' => $upload['url'],
                'image_public_id' => $upload['public_id'] ?? null,
            ]);

            if (!$updatedUser) {
                throw new RuntimeException('Failed to update user avatar.');
            }

            return $updatedUser->fresh()->load(['roles', 'permissions']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE AVATAR
    |--------------------------------------------------------------------------
    */
    public function deleteAvatar(int $userId)
    {
        return DB::transaction(function () use ($userId) {

            $user = $this->userRepo->findById($userId);

            if (!$user) {
                throw new ModelNotFoundException("User not found.");
            }

            if (!empty($user->image_public_id)) {
                $this->imageService->delete($user->image_public_id);
            }

            $updatedUser = $this->userRepo->update($userId, [
                'image' => null,
                'image_public_id' => null,
            ]);

            if (!$updatedUser) {
                throw new RuntimeException('Failed to remove avatar.');
            }

            return $updatedUser->fresh()->load(['roles', 'permissions']);
        });
    }
}