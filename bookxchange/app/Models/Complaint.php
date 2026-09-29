<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'complainant_id', 'accused_id',
        'subject', 'description', 'status', 'admin_note',
    ];

    public function complainant() { return $this->belongsTo(User::class, 'complainant_id'); }
    public function accused()     { return $this->belongsTo(User::class, 'accused_id'); }
}
