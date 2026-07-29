<?php

namespace App\Enums;

enum RoleType: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Telecaller = 'telecaller';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Manager => 'Manager',
            self::Telecaller => 'Telecaller',
        };
    }

    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
