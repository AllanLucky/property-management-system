<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ApiResponse
{

    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $code = 200,
        mixed $meta = null,
        mixed $links = null
    ): JsonResponse {

        return response()->json([

            'status' => true,

            'code' => $code,

            'message' => $message,

            'data' => $data,

            'meta' => $meta,

            'links' => $links,

            'errors' => null,

            'timestamp' => now()->toISOString(),

            'request_id' => request()->header('X-Request-ID')
                ?? Str::uuid()->toString(),

        ], $code);
    }



    /*
    |--------------------------------------------------------------------------
    | ERROR RESPONSE
    |--------------------------------------------------------------------------
    */
    public static function error(
        string $message = 'Error',
        mixed $errors = null,
        int|string $code = 400
    ): JsonResponse {


        /*
        |--------------------------------------------------------------------------
        | AUTO FIX WRONG PARAMETER ORDER
        |--------------------------------------------------------------------------
        */

        if (
            is_int($errors) &&
            (
                is_string($code) ||
                is_array($code) ||
                is_object($code)
            )
        ) {

            [$errors, $code] = [$code, $errors];

        }


        $code = is_numeric($code)
            ? (int)$code
            : 500;



        return response()->json([

            'status' => false,

            'code' => $code,

            'message' => $message,

            'data' => null,

            'errors' => self::normalizeErrors($errors),


            'timestamp' => now()->toISOString(),

            'request_id' => request()->header('X-Request-ID')
                ?? Str::uuid()->toString(),

        ], $code);

    }




    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ERRORS
    |--------------------------------------------------------------------------
    */
    protected static function normalizeErrors(mixed $errors): mixed
    {

        if ($errors === null) {
            return null;
        }


        if (is_string($errors)) {

            return [
                'message'=>$errors
            ];

        }



        if (is_array($errors)) {

            return $errors;

        }



        if (is_object($errors)) {

            return (array)$errors;

        }



        return [
            'message'=>'Unknown error'
        ];

    }





    /*
    |--------------------------------------------------------------------------
    | AUTH BLOCKED
    |--------------------------------------------------------------------------
    */
    public static function authBlocked(
        string $message,
        ?string $accountStatus=null,
        ?string $approvalStatus=null
    ): JsonResponse {


        return self::error(
            $message,
            [
                'account_status'=>$accountStatus,
                'approval_status'=>$approvalStatus
            ],
            403
        );

    }




    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */
    public static function validation(
        mixed $errors,
        string $message='Validation error'
    ): JsonResponse {

        return self::error(
            $message,
            $errors,
            422
        );

    }





    /*
    |--------------------------------------------------------------------------
    | AUTH RESPONSES
    |--------------------------------------------------------------------------
    */

    public static function unauthorized(
        string $message='Unauthenticated'
    ): JsonResponse {

        return self::error(
            $message,
            null,
            401
        );

    }



    public static function forbidden(
        string $message='Forbidden'
    ): JsonResponse {

        return self::error(
            $message,
            null,
            403
        );

    }




    public static function notFound(
        string $message='Not found'
    ): JsonResponse {

        return self::error(
            $message,
            null,
            404
        );

    }




    public static function conflict(
        string $message='Conflict'
    ): JsonResponse {

        return self::error(
            $message,
            null,
            409
        );

    }




    /*
    |--------------------------------------------------------------------------
    | SERVER ERROR
    |--------------------------------------------------------------------------
    */
    public static function serverError(
        string $message='Server error',
        mixed $errors=null
    ): JsonResponse {


        return self::error(
            $message,
            $errors,
            500
        );

    }





    /*
    |--------------------------------------------------------------------------
    | CRUD RESPONSES
    |--------------------------------------------------------------------------
    */

    public static function created(
        mixed $data=null,
        string $message='Created successfully'
    ): JsonResponse {


        return self::success(
            $data,
            $message,
            201
        );

    }




    public static function updated(
        mixed $data=null,
        string $message='Updated successfully'
    ): JsonResponse {


        return self::success(
            $data,
            $message,
            200
        );

    }





    public static function deleted(
        mixed $data=null,
        string $message='Deleted successfully'
    ): JsonResponse {


        return self::success(
            $data,
            $message,
            200
        );

    }





    public static function noContent(): JsonResponse
    {

        return response()->json(null,204);

    }







    /*
    |--------------------------------------------------------------------------
    | PAGINATION RESPONSE
    |--------------------------------------------------------------------------
    */
    public static function paginated(
        $paginator,
        string $message='Success'
    ): JsonResponse {


        return response()->json([

            'status'=>true,

            'code'=>200,

            'message'=>$message,


            'data'=>$paginator->items(),


            'meta'=>[

                'current_page'=>$paginator->currentPage(),

                'last_page'=>$paginator->lastPage(),

                'per_page'=>$paginator->perPage(),

                'total'=>$paginator->total(),

                'from'=>$paginator->firstItem(),

                'to'=>$paginator->lastItem(),

                'has_more_pages'=>$paginator->hasMorePages(),

            ],



            'links'=>[

                'first'=>$paginator->url(1),

                'last'=>$paginator->url(
                    $paginator->lastPage()
                ),

                'prev'=>$paginator->previousPageUrl(),

                'next'=>$paginator->nextPageUrl(),

            ],



            'errors'=>null,


            'timestamp'=>now()->toISOString(),


            'request_id'=>request()->header('X-Request-ID')
                ?? Str::uuid()->toString(),


        ]);

    }





    /*
    |--------------------------------------------------------------------------
    | RESOURCE COLLECTION RESPONSE
    |--------------------------------------------------------------------------
    */
    public static function collection(
        mixed $collection,
        string $message='Data fetched successfully'
    ): JsonResponse {


        return self::success(
            $collection,
            $message
        );

    }





    /*
    |--------------------------------------------------------------------------
    | USER RESPONSE
    |--------------------------------------------------------------------------
    */

    public static function user(
        $user,
        string $message='User fetched successfully'
    ): JsonResponse {


        return self::success([


            'id'=>$user->id,


            'name'=>trim(

                ($user->first_name ?? '')
                .' '.
                ($user->last_name ?? '')

            ),


            'email'=>$user->email,


            'phone'=>$user->phone,


            'status'=>$user->account_status ?? null,


            'approval_status'=>$user->approval_status ?? null,


            'roles'=>$user->roles
                ? $user->roles->pluck('name')->values()
                : [],


            'permissions'=>$user->permissions
                ? $user->permissions->pluck('name')->values()
                : [],



            'created_at'=>$user->created_at,


        ],$message);

    }





    /*
    |--------------------------------------------------------------------------
    | RBAC RESPONSE
    |--------------------------------------------------------------------------
    */

    public static function rbac(
        mixed $data,
        string $message='Success'
    ): JsonResponse {


        return self::success(
            $data,
            $message
        );

    }


}