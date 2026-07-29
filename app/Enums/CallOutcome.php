<?php

namespace App\Enums;

enum CallOutcome: string
{
    case Connected = 'connected';
    case NoAnswer = 'no_answer';
    case Busy = 'busy';
    case WrongNumber = 'wrong_number';
    case Interested = 'interested';
    case NotInterested = 'not_interested';
    case CallbackRequested = 'callback_requested';
    case Converted = 'converted';

    public function label(): string
    {
        return match ($this) {
            self::Connected => 'Connected',
            self::NoAnswer => 'No Answer',
            self::Busy => 'Busy',
            self::WrongNumber => 'Wrong Number',
            self::Interested => 'Interested',
            self::NotInterested => 'Not Interested',
            self::CallbackRequested => 'Callback Requested',
            self::Converted => 'Converted',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Connected => 'blue',
            self::NoAnswer, self::Busy => 'amber',
            self::WrongNumber, self::NotInterested => 'rose',
            self::Interested => 'amber',
            self::CallbackRequested => 'violet',
            self::Converted => 'emerald',
        };
    }

    /** Whether this outcome represents a successfully connected conversation. */
    public function isConnected(): bool
    {
        return in_array($this, [
            self::Connected, self::Interested, self::NotInterested,
            self::CallbackRequested, self::Converted,
        ], true);
    }

    /** Maps an outcome to the LeadStatus it should trigger (or null). */
    public function toLeadStatus(): ?LeadStatus
    {
        $map = config('telecrm.outcome_status_map', []);

        return isset($map[$this->value]) ? LeadStatus::tryFrom($map[$this->value]) : null;
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
