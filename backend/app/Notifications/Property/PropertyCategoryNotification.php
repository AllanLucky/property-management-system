<?php

namespace App\Notifications\Property;

use App\Models\PropertyCategory;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PropertyCategoryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /*
    |--------------------------------------------------------------------------
    | PROPERTIES
    |--------------------------------------------------------------------------
    */
    protected PropertyCategory $propertyCategory;

    protected string $action;

    /*
    |--------------------------------------------------------------------------
    | CREATE NEW NOTIFICATION
    |--------------------------------------------------------------------------
    */
    public function __construct(
        PropertyCategory $propertyCategory,
        string $action = 'created'
    ) {
        $this->propertyCategory = $propertyCategory;
        $this->action = $action;
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY CHANNELS
    |--------------------------------------------------------------------------
    */
    public function via(object $notifiable): array
    {
        return [
            'mail',
            'database',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MAIL NOTIFICATION
    |--------------------------------------------------------------------------
    */
    public function toMail(object $notifiable): MailMessage
    {
        $categoryName = $this->propertyCategory->name;

        return (new MailMessage)
            ->subject(
                "Property Category {$this->action}"
            )

            ->greeting(
                "Hello {$notifiable->name},"
            )

            ->line(
                "The property category '{$categoryName}' has been {$this->action} successfully."
            )

            ->line(
                "Category Status: {$this->propertyCategory->status}"
            )

            ->line(
                "Featured: " .
                ($this->propertyCategory->is_featured
                    ? 'Yes'
                    : 'No')
            )

            ->action(
                'View Property Category',
                url(
                    '/admin/property-categories/' .
                    $this->propertyCategory->id
                )
            )

            ->line(
                'Thank you for using our real estate management system.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE NOTIFICATION
    |--------------------------------------------------------------------------
    */
    public function toDatabase(object $notifiable): array
    {
        return [
            'id' => $this->propertyCategory->id,

            'name' => $this->propertyCategory->name,

            'slug' => $this->propertyCategory->slug,

            'status' => $this->propertyCategory->status,

            'is_featured' => $this->propertyCategory->is_featured,

            'action' => $this->action,

            'message' =>
                "Property category '{$this->propertyCategory->name}' has been {$this->action}.",

            'created_at' => now(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | ARRAY REPRESENTATION
    |--------------------------------------------------------------------------
    */
    public function toArray(object $notifiable): array
    {
        return [
            'property_category_id' =>
                $this->propertyCategory->id,

            'property_category_name' =>
                $this->propertyCategory->name,

            'action' => $this->action,
        ];
    }
}