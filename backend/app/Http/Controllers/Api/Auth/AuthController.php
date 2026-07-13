<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\DTOs\RegisterUserDTO;
use App\Services\Auth\AuthService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */
    public function register(RegisterRequest $request)
    {
        $dto = RegisterUserDTO::fromArray($request->validated());

        $result = $this->authService->register($dto);

        return ApiResponse::success(
            $result['data'],
            $result['message']
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $result = $this->authService->login($credentials);

        /*
        |----------------------------------------------------------
        | INVALID CREDENTIALS
        |----------------------------------------------------------
        */
        if ($result === null) {
            return ApiResponse::unauthorized('Invalid credentials');
        }

        /*
        |----------------------------------------------------------
        | ERROR RESPONSE (BLOCKED / REJECTED / ETC)
        |----------------------------------------------------------
        */
        if ($result['success'] === false) {
            return ApiResponse::error(
                $result['message'],
                $result['errors'] ?? [],
                $result['code'] ?? 403
            );
        }

        /*
        |----------------------------------------------------------
        | SUCCESS RESPONSE
        |----------------------------------------------------------
        */
        return ApiResponse::success(
            $result['data'],
            $result['message']
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $this->authService->logout($user);
        }

        return ApiResponse::success(
            null,
            'Logged out successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER (ME)
    |--------------------------------------------------------------------------
    */
    public function me(Request $request)
    {
        $user = $request->user()->load(['roles', 'permissions']);

        return ApiResponse::success(
            [
                'user' => new UserResource($user),
            ],
            'User profile fetched successfully'
        );
    }
}