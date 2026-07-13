<?php

namespace App\Services\Auth;

use App\Models\User;
use App\DTOs\RegisterUserDTO;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\User\UserStatusMessageService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Notifications\Password\OtpNotification;
use Spatie\Permission\Models\Role;

class AuthService
{
    public function __construct(
        protected UserRepositoryInterface $userRepo,
        protected UserStatusMessageService $statusMessageService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | REGISTER USER
    |--------------------------------------------------------------------------
    */
    public function register(RegisterUserDTO $dto): array
    {
        $otp = random_int(100000, 999999);

        $user = $this->userRepo->create([
            'first_name'      => $dto->first_name,
            'last_name'       => $dto->last_name,
            'email'           => $dto->email,
            'phone'           => $dto->phone,
            'password'        => Hash::make($dto->password),

            'is_verified'     => false,
            'account_status'  => User::STATUS_INACTIVE,
            'approval_status' => User::APPROVAL_PENDING,

            'otp'             => $otp,
            'otp_expires_at'  => now()->addMinutes(5),
        ]);

        $this->assignDefaultRole($user);

        $user->notify(new OtpNotification($otp));

        return [
            'success' => true,
            'message' => 'Registration successful. OTP sent to email.',
            'data' => [
                'user' => $this->formatUser($user->fresh(['roles', 'permissions'])),
                'otp_sent' => true,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN USER
    |--------------------------------------------------------------------------
    */
    public function login(array $data): array
    {
        $user = $this->userRepo->findByEmail($data['email']);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        if ($response = $this->checkAccountRestrictions($user)) {
            return $response;
        }

        $accessToken = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = Str::random(64);

        $user->update([
            'refresh_token' => hash('sha256', $refreshToken),
            'refresh_token_expires_at' => now()->addDays(7),
            'last_login_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $this->formatUser($user->load(['roles', 'permissions'])),
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH TOKEN
    |--------------------------------------------------------------------------
    */
    public function refreshToken(string $refreshToken): array
    {
        $user = $this->userRepo->findByRefreshToken(
            hash('sha256', $refreshToken)
        );

        if (!$user || now()->isAfter($user->refresh_token_expires_at)) {
            return $this->errorResponse('Invalid or expired refresh token', 401);
        }

        if ($response = $this->checkAccountRestrictions($user)) {
            return $response;
        }

        $user->tokens()->delete();

        return [
            'success' => true,
            'message' => 'Token refreshed successfully',
            'data' => [
                'user' => $this->formatUser($user->load(['roles', 'permissions'])),
                'access_token' => $user->createToken('auth_token')->plainTextToken,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */
    public function logout(User $user): array
    {
        $user->tokens()->delete();

        $user->update([
            'refresh_token' => null,
            'refresh_token_expires_at' => null,
        ]);

        return [
            'success' => true,
            'message' => 'Logged out successfully',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT RESTRICTIONS (NOW CLEAN + SERVICE-BASED)
    |--------------------------------------------------------------------------
    */
    private function checkAccountRestrictions(User $user): ?array
    {
        if ($user->approval_status === User::APPROVAL_PENDING ||
            $user->approval_status === User::APPROVAL_REJECTED) {

            return $this->errorResponse(
                $this->statusMessageService->approvalMessage($user),
                403,
                ['approval_status' => $user->approval_status]
            );
        }

        if (in_array($user->account_status, [
            User::STATUS_BANNED,
            User::STATUS_SUSPENDED,
            User::STATUS_INACTIVE
        ])) {

            return $this->errorResponse(
                $this->statusMessageService->accountMessage($user),
                403,
                ['account_status' => $user->account_status]
            );
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT ROLE
    |--------------------------------------------------------------------------
    */
    private function assignDefaultRole(User $user): void
    {
        $role = Role::where('name', 'user')
            ->where('guard_name', 'web')
            ->first();

        if ($role) {
            $user->syncRoles([$role->name]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */
    private function errorResponse(string $message, int $code, array $errors = []): array
    {
        return [
            'success' => false,
            'message' => $message,
            'code' => $code,
            'errors' => $errors,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT USER
    |--------------------------------------------------------------------------
    */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,

            'roles' => $user->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ])->values(),

            'permissions' => $user->getAllPermissions()
                ->pluck('name')
                ->values(),

            'account_status' => $user->account_status,
            'approval_status' => $user->approval_status,
        ];
    }
}