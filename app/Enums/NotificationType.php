<?php

namespace App\Enums;

enum NotificationType: string
{
    case FollowUpReminder = 'follow_up_reminder';
    case NewAssignment = 'new_assignment';
    case OverdueAlert = 'overdue_alert';
    case ManagerAlert = 'manager_alert';

    public function label(): string
    {
        return match ($this) {
            self::FollowUpReminder => 'Follow-up Reminder',
            self::NewAssignment => 'New Lead Assigned',
            self::OverdueAlert => 'Overdue Task',
            self::ManagerAlert => 'Manager Alert',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::FollowUpReminder => 'clock',
            self::NewAssignment => 'user-plus',
            self::OverdueAlert => 'alert-triangle',
            self::ManagerAlert => 'megaphone',
        };
    }

    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
