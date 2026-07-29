<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class LeadTag extends Model
{
    protected $fillable = ['name', 'slug', 'color'];

    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'lead_tag_map');
    }
}
