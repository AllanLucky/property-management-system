<?php

namespace App\Http\Controllers\Api\Profile;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\ProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET PROFILE
    |--------------------------------------------------------------------------
    */
    public function show(Request $request)
    {
        try {
            $user = $request->user();

            $profile = $this->profileService->getProfile($user->id);

            return ApiResponse::success(
                $profile,
                'Profile fetched successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to fetch profile', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ]);

            return ApiResponse::error(
                'Failed to fetch profile',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE PROFILE
    |--------------------------------------------------------------------------
    */
    public function update(Request $request)
    {
        try {

            $user = $request->user();

            $validated = $request->validate([
                'first_name' => [
                    'sometimes',
                    'string',
                    'max:100'
                ],

                'last_name' => [
                    'sometimes',
                    'string',
                    'max:100'
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:20'
                ],

                'address' => [
                    'nullable',
                    'string',
                    'max:255'
                ],

                'bio' => [
                    'nullable',
                    'string',
                    'max:1000'
                ],

                'gender' => [
                    'nullable',
                    Rule::in(['male', 'female', 'other'])
                ],

                'nationality' => [
                    'nullable',
                    'string',
                    'max:100'
                ],

                'date_of_birth' => [
                    'nullable',
                    'date'
                ],

                'image' => [
                    'sometimes',
                    'nullable',
                    'image',
                    'mimes:jpg,jpeg,png,webp,gif',
                    'max:5120',
                ],
            ]);


            if ($request->hasFile('image')) {
                $validated['image'] = $request->file('image');
            }


            $profile = $this->profileService->updateProfile(
                $user->id,
                $validated
            );


            return ApiResponse::success(
                $profile,
                'Profile updated successfully'
            );


        } catch (ValidationException $e) {

            return ApiResponse::error(
                'Validation failed',
                $e->errors(),
                422
            );


        } catch (Throwable $e) {

            Log::error('Profile update failed', [
                'user_id' => $request->user()?->id,
                'error'   => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString(),
            ]);


            return ApiResponse::error(
                'Failed to update profile',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CHANGE PASSWORD
    |--------------------------------------------------------------------------
    */
    public function changePassword(Request $request)
    {
        try {

            $user = $request->user();

            $validated = $request->validate([
                'old_password' => [
                    'required',
                    'string',
                ],

                'new_password' => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',
                ],
            ]);


            $this->profileService->changePassword(
                $user->id,
                $validated['old_password'],
                $validated['new_password']
            );


            return ApiResponse::success(
                null,
                'Password changed successfully'
            );


        } catch (RuntimeException $e) {

            return ApiResponse::error(
                $e->getMessage(),
                [],
                422
            );


        } catch (Throwable $e) {

            Log::error('Password change failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);


            return ApiResponse::error(
                'Failed to change password',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD AVATAR
    |--------------------------------------------------------------------------
    */
    public function uploadAvatar(Request $request)
    {
        try {

            $user = $request->user();


            $request->validate([
                'image' => [
                    'required',
                    'image',
                    'mimes:jpg,jpeg,png,webp,gif',
                    'max:5120',
                ],
            ]);


            $profile = $this->profileService->updateAvatar(
                $user->id,
                $request->file('image')
            );


            return ApiResponse::success(
                $profile,
                'Profile image updated successfully'
            );


        } catch (ValidationException $e) {

            return ApiResponse::error(
                'Image validation failed',
                $e->errors(),
                422
            );


        } catch (Throwable $e) {

            Log::error('Avatar upload failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);


            return ApiResponse::error(
                'Failed to upload profile image',
                [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE AVATAR
    |--------------------------------------------------------------------------
    */
    public function deleteAvatar(Request $request)
    {
        try {

            $user = $request->user();


            $profile = $this->profileService->deleteAvatar(
                $user->id
            );


            return ApiResponse::success(
                $profile,
                'Profile image deleted successfully'
            );


        } catch (Throwable $e) {

            Log::error('Avatar delete failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);


            return ApiResponse::error(
                'Failed to delete profile image',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }
}