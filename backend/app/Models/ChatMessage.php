<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'exchange_request_id', 'sender_id',
        'message', 'message_type',
        'meeting_place', 'meeting_time', 'is_read',
    ];

    protected $casts = [
        'is_read'      => 'boolean',
        'meeting_time' => 'datetime',
    ];

    public function sender()          { return $this->belongsTo(User::class, 'sender_id'); }
    public function exchangeRequest() { return $this->belongsTo(ExchangeRequest::class); }
}
