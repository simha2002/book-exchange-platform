<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $fillable = ['exchange_request_id', 'sender_id', 'message', 'is_read'];
    protected $casts    = ['is_read' => 'boolean'];

    public function sender()          { return $this->belongsTo(User::class, 'sender_id'); }
    public function exchangeRequest() { return $this->belongsTo(ExchangeRequest::class); }
}
