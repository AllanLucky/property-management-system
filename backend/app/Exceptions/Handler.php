<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Spatie\Permission\Exceptions\UnauthorizedException;
use Throwable;
use App\Helpers\ApiResponse;

class Handler extends ExceptionHandler
{
    protected $dontReport = [];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // You can log to Sentry / Log channel here later
        });
    }

    public function render($request, Throwable $exception)
    {
        /*
        |--------------------------------------------------------------------------
        | ONLY API RESPONSES
        |--------------------------------------------------------------------------
        */
        if ($request->is('api/*') || $request->expectsJson()) {

            /*
            |--------------------------------------------------------------------------
            | VALIDATION ERROR
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof ValidationException) {
                return ApiResponse::validation($exception->errors());
            }

            /*
            |--------------------------------------------------------------------------
            | AUTH ERROR
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof AuthenticationException) {
                return ApiResponse::unauthorized('Unauthenticated. Please login.');
            }

            /*
            |--------------------------------------------------------------------------
            | MODEL NOT FOUND (Eloquent)
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof ModelNotFoundException) {
                return ApiResponse::notFound('Resource not found.');
            }

            /*
            |--------------------------------------------------------------------------
            | ROUTE NOT FOUND
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof NotFoundHttpException) {
                return ApiResponse::notFound('Endpoint not found.');
            }

            /*
            |--------------------------------------------------------------------------
            | SPATIE RBAC EXCEPTION
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof UnauthorizedException) {

                $message = strtolower($exception->getMessage());

                return match (true) {

                    str_contains($message, 'role') =>
                        ApiResponse::forbidden('Access denied. Role required.'),

                    str_contains($message, 'permission') =>
                        ApiResponse::forbidden('Access denied. Permission required.'),

                    default =>
                        ApiResponse::forbidden('Access denied.'),
                };
            }

            /*
            |--------------------------------------------------------------------------
            | HTTP EXCEPTION
            |--------------------------------------------------------------------------
            */
            if ($exception instanceof HttpException) {
                return ApiResponse::error(
                    $exception->getMessage() ?: 'HTTP error',
                    null,
                    $exception->getStatusCode()
                );
            }

            /*
            |--------------------------------------------------------------------------
            | FALLBACK (PRODUCTION SAFE)
            |--------------------------------------------------------------------------
            */
            return ApiResponse::serverError(
                config('app.debug')
                    ? $exception->getMessage()
                    : 'Something went wrong.',
                config('app.debug') ? [
                    'exception' => class_basename($exception),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                ] : null
            );
        }

        return parent::render($request, $exception);
    }
}