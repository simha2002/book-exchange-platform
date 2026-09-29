<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRequest extends Model
{
    protected $fillable = [
        'requester_id',
        'owner_id',
        'book_id',
        'offered_book_id',
        'status',
        'message',
    ];

    public function requester()   { return $this->belongsTo(User::class, 'requester_id'); }
    public function owner()       { return $this->belongsTo(User::class, 'owner_id'); }
    public function book()        { return $this->belongsTo(Book::class, 'book_id'); }
    public function offeredBook() { return $this->belongsTo(Book::class, 'offered_book_id'); }
}
