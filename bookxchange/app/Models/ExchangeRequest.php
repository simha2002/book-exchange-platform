<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRequest extends Model
{
    protected $fillable = [
        'requester_id', 'owner_id',
        'requested_book_id', 'offered_book_id',
        'message', 'requester_accepted', 'owner_accepted', 'status',
    ];

    protected $casts = [
        'requester_accepted' => 'boolean',
        'owner_accepted'     => 'boolean',
    ];

    public function requester()     { return $this->belongsTo(User::class, 'requester_id'); }
    public function owner()         { return $this->belongsTo(User::class, 'owner_id'); }
    public function requestedBook() { return $this->belongsTo(Book::class, 'requested_book_id'); }
    public function offeredBook()   { return $this->belongsTo(Book::class, 'offered_book_id'); }
    public function chats()         { return $this->hasMany(Chat::class)->latest(); }

    public function isMutuallyAccepted(): bool
    {
        return $this->requester_accepted && $this->owner_accepted;
    }
}
