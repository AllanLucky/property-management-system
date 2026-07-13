<?php

namespace App\Notifications\RoleRequest;

use App\Models\RoleRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RoleRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected RoleRequest $roleRequest;
    protected string $type;

    /**
     * Type can be: created | approved | rejected
     */
    public function __construct(RoleRequest $roleRequest, string $type = 'created')
    {
        $this->roleRequest = $roleRequest;
        $this->type = $type;
    }

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Mail content
     */
    public function toMail(object $notifiable): MailMessage
    {
        return match ($this->type) {

            /*
            |--------------------------------------------------------------------------
            | ROLE REQUEST CREATED (notify admins)
            |--------------------------------------------------------------------------
            */
            'created' => (new MailMessage)
                ->subject('New Role Request Submitted')
                ->greeting('Hello Admin,')
                ->line('A new role request has been submitted.')
                ->line('User: ' . $this->roleRequest->user->first_name . ' ' . $this->roleRequest->user->last_name)
                ->line('Requested Role: ' . $this->roleRequest->requested_role)
                ->line('Reason: ' . ($this->roleRequest->reason ?? 'No reason provided'))
                ->action('View Request', url('/admin/role-requests/' . $this->roleRequest->id))
                ->line('Please review and take action.'),

            /*
            |--------------------------------------------------------------------------
            | APPROVED NOTIFICATION (notify user)
            |--------------------------------------------------------------------------
            */
            'approved' => (new MailMessage)
                ->subject('Your Role Request Approved')
                ->greeting('Congratulations!')
                ->line('Your role request has been approved.')
                ->line('New Role: ' . $this->roleRequest->requested_role)
                ->line('You now have additional access in the system.')
                ->action('Go to Dashboard', url('/dashboard'))
                ->line('Thank you for using our platform.'),

            /*
            |--------------------------------------------------------------------------
            | REJECTED NOTIFICATION (notify user)
            |--------------------------------------------------------------------------
            */
            'rejected' => (new MailMessage)
                ->subject('Role Request Rejected')
                ->greeting('Hello ' . $this->roleRequest->user->first_name)
                ->line('Your role request was reviewed but unfortunately rejected.')
                ->line('Requested Role: ' . $this->roleRequest->requested_role)
                ->line('Admin Notes: ' . ($this->roleRequest->admin_notes ?? 'No reason provided'))
                ->action('Submit New Request', url('/role-requests/create'))
                ->line('You may try again or contact support.'),

            default => (new MailMessage)
                ->subject('Role Request Update')
                ->line('Your role request has been updated.'),
        };
    }

    /**
     * Optional array representation (for database / logs)
     */
    public function toArray(object $notifiable): array
    {
        return [
            'role_request_id' => $this->roleRequest->id,
            'user_id' => $this->roleRequest->user_id,
            'requested_role' => $this->roleRequest->requested_role,
            'status' => $this->roleRequest->status,
            'type' => $this->type,
        ];
    }
}