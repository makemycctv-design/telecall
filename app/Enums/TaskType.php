<?php

namespace App\Enums;

enum TaskType: string
{
    case FirstCall = 'first_call';
    case FollowUp = 'follow_up';
    case Callback = 'callback';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::FirstCall => 'First Call',
            self::FollowUp => 'Follow Up',
            self::Callback => 'Callback',
            self::Custom => 'Custom',
        };
    }

    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
