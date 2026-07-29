<?php

namespace App\Enums;

enum LeadStatus: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Interested = 'interested';
    case NotInterested = 'not_interested';
    case Callback = 'callback';
    case Converted = 'converted';

    public function label(): string
    {
        return match ($this) {
            self::New => 'New',
            self::InProgress => 'In Progress',
            self::Interested => 'Interested',
            self::NotInterested => 'Not Interested',
            self::Callback => 'Callback',
            self::Converted => 'Converted',
        };
    }

    /** Tailwind badge colour token consumed by the React <StatusBadge/>. */
    public function color(): string
    {
        return match ($this) {
            self::New => 'slate',
            self::InProgress => 'blue',
            self::Interested => 'amber',
            self::NotInterested => 'rose',
            self::Callback => 'violet',
            self::Converted => 'emerald',
        };
    }

    /** Statuses considered "open" for pipeline / ongoing reports. */
    public static function openStatuses(): array
    {
        return [self::New->value, self::InProgress->value, self::Interested->value, self::Callback->value];
    }

    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public static function options(): array
    {
        return array_map(fn (self $c) => ['value' => $c->value, 'label' => $c->label(), 'color' => $c->color()], self::cases());
    }
}
