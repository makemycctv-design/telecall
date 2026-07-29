<?php

namespace App\Services;

use App\Enums\LeadPriority;
use App\Enums\LeadStatus;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LeadImportService
{
    public function __construct(private LeadAssignmentService $assignment) {}

    /**
     * Import leads from a parsed CSV (array of associative rows keyed by header).
     * Returns a summary: imported / skipped / errors.
     *
     * Expected headers (case-insensitive): name, phone, email, company, city,
     * source, priority, notes.
     *
     * @param  array<int,array<string,string>>  $rows
     * @return array{imported:int,skipped:int,errors:array<int,string>}
     */
    public function importRows(array $rows, User $importedBy, bool $autoAssign = true): array
    {
        $imported = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $index => $raw) {
            $row = $this->normaliseKeys($raw);
            $line = $index + 2; // account for header row + 1-based

            $name = trim($row['name'] ?? '');
            $phone = preg_replace('/[^0-9+]/', '', $row['phone'] ?? '');

            if ($name === '' || $phone === '') {
                $skipped++;
                $errors[] = "Row {$line}: missing name or phone.";
                continue;
            }

            // De-duplicate on phone number.
            if (Lead::where('phone', $phone)->exists()) {
                $skipped++;
                continue;
            }

            try {
                $lead = DB::transaction(function () use ($row, $name, $phone, $importedBy) {
                    $sourceId = $this->resolveSourceId($row['source'] ?? null);
                    $priority = LeadPriority::tryFrom(strtolower($row['priority'] ?? '')) ?? LeadPriority::Medium;

                    return Lead::create([
                        'name' => $name,
                        'phone' => $phone,
                        'email' => $row['email'] ?? null,
                        'company' => $row['company'] ?? null,
                        'city' => $row['city'] ?? null,
                        'notes' => $row['notes'] ?? null,
                        'status' => LeadStatus::New->value,
                        'priority' => $priority->value,
                        'lead_source_id' => $sourceId,
                        'created_by' => $importedBy->id,
                    ]);
                });

                if ($autoAssign) {
                    $this->assignment->autoAssign($lead, $importedBy);
                }

                $imported++;
            } catch (\Throwable $e) {
                $skipped++;
                $errors[] = "Row {$line}: {$e->getMessage()}";
            }
        }

        return ['imported' => $imported, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * Parse an uploaded CSV file path into an array of header-keyed rows.
     *
     * @return array<int,array<string,string>>
     */
    public function parseCsv(string $path): array
    {
        $rows = [];
        if (($handle = fopen($path, 'r')) === false) {
            return $rows;
        }

        $header = null;
        while (($data = fgetcsv($handle, 0, ',')) !== false) {
            if ($header === null) {
                $header = array_map(fn ($h) => Str::of($h)->trim()->lower()->toString(), $data);
                continue;
            }
            $rows[] = array_combine($header, array_pad($data, count($header), null));
        }
        fclose($handle);

        return $rows;
    }

    protected function normaliseKeys(array $row): array
    {
        $out = [];
        foreach ($row as $key => $value) {
            $out[Str::of((string) $key)->trim()->lower()->toString()] = is_string($value) ? trim($value) : $value;
        }

        return $out;
    }

    protected function resolveSourceId(?string $name): ?int
    {
        $name = trim((string) $name);
        if ($name === '') {
            return null;
        }

        return LeadSource::firstOrCreate(
            ['slug' => Str::slug($name)],
            ['name' => $name, 'is_active' => true],
        )->id;
    }
}
