<?php

namespace Database\Seeders;

use App\Models\MaintenanceAttachment;
use App\Models\MaintenanceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class MaintenanceAttachmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Load Existing Maintenance Requests
        |--------------------------------------------------------------------------
        */

        $requests = MaintenanceRequest::query()
            ->orderBy('id')
            ->get();

        if ($requests->isEmpty()) {
            $this->command->warn(
                'No maintenance requests found. Run MaintenanceRequestSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Load Existing Users
        |--------------------------------------------------------------------------
        */

        $userIds = User::query()
            ->pluck('id')
            ->toArray();

        if (empty($userIds)) {
            $this->command->warn(
                'No users found. Maintenance attachments were not seeded.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Attachment Scenarios
        |--------------------------------------------------------------------------
        */

        $attachments = [
            [
                'file_name' => 'bathroom-water-leak.jpg',
                'original_name' => 'Bathroom Water Leak.jpg',
                'file_path' => 'maintenance/attachments/bathroom-water-leak.jpg',
                'disk' => 'private',
                'file_type' => 'image',
                'mime_type' => 'image/jpeg',
                'file_extension' => 'jpg',
                'file_size' => 245760,
                'attachment_type' => 'image',
                'description' => 'Photo showing water leakage in the bathroom.',
                'is_public' => false,
            ],
            [
                'file_name' => 'electrical-inspection.pdf',
                'original_name' => 'Electrical Inspection Report.pdf',
                'file_path' => 'maintenance/attachments/electrical-inspection.pdf',
                'disk' => 'private',
                'file_type' => 'document',
                'mime_type' => 'application/pdf',
                'file_extension' => 'pdf',
                'file_size' => 512000,
                'attachment_type' => 'document',
                'description' => 'Electrical inspection report.',
                'is_public' => false,
            ],
            [
                'file_name' => 'plumbing-invoice.pdf',
                'original_name' => 'Plumbing Repair Invoice.pdf',
                'file_path' => 'maintenance/attachments/plumbing-invoice.pdf',
                'disk' => 'private',
                'file_type' => 'document',
                'mime_type' => 'application/pdf',
                'file_extension' => 'pdf',
                'file_size' => 180000,
                'attachment_type' => 'invoice',
                'description' => 'Invoice for plumbing repair services.',
                'is_public' => false,
            ],
            [
                'file_name' => 'repair-receipt.jpg',
                'original_name' => 'Repair Payment Receipt.jpg',
                'file_path' => 'maintenance/attachments/repair-receipt.jpg',
                'disk' => 'private',
                'file_type' => 'image',
                'mime_type' => 'image/jpeg',
                'file_extension' => 'jpg',
                'file_size' => 125000,
                'attachment_type' => 'receipt',
                'description' => 'Receipt for purchased repair materials.',
                'is_public' => false,
            ],
            [
                'file_name' => 'before-repair.jpg',
                'original_name' => 'Before Repair.jpg',
                'file_path' => 'maintenance/attachments/before-repair.jpg',
                'disk' => 'private',
                'file_type' => 'image',
                'mime_type' => 'image/jpeg',
                'file_extension' => 'jpg',
                'file_size' => 320000,
                'attachment_type' => 'before_photo',
                'description' => 'Condition of the damaged area before repair.',
                'is_public' => false,
            ],
            [
                'file_name' => 'after-repair.jpg',
                'original_name' => 'After Repair.jpg',
                'file_path' => 'maintenance/attachments/after-repair.jpg',
                'disk' => 'private',
                'file_type' => 'image',
                'mime_type' => 'image/jpeg',
                'file_extension' => 'jpg',
                'file_size' => 410000,
                'attachment_type' => 'after_photo',
                'description' => 'Condition of the area after repair completion.',
                'is_public' => false,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Attachment Records
        |--------------------------------------------------------------------------
        */

        $created = 0;

        foreach ($requests as $index => $request) {
            // Create one attachment for each request, cycling through scenarios.
            $attachment = $attachments[$index % count($attachments)];

            $uploadedBy = $userIds[$index % count($userIds)];

            MaintenanceAttachment::updateOrCreate(
                [
                    'maintenance_request_id' => $request->id,
                    'file_name' => $attachment['file_name'],
                ],
                [
                    'uploaded_by' => $uploadedBy,
                    'original_name' => $attachment['original_name'],
                    'file_path' => $attachment['file_path'],
                    'disk' => $attachment['disk'],
                    'file_type' => $attachment['file_type'],
                    'mime_type' => $attachment['mime_type'],
                    'file_extension' => $attachment['file_extension'],
                    'file_size' => $attachment['file_size'],
                    'attachment_type' => $attachment['attachment_type'],
                    'description' => $attachment['description'],
                    'is_public' => $attachment['is_public'],
                ]
            );

            $created++;
        }

        $this->command->info(
            "{$created} maintenance attachment records seeded successfully."
        );
    }
}
