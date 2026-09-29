<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'exchange_request_id', 'reviewer_id',
        'reviewed_user_id', 'book_id',
        'rating', 'comment',
    ];

    public function reviewer()       { return $this->belongsTo(User::class, 'reviewer_id'); }
    public function reviewedUser()   { return $this->belongsTo(User::class, 'reviewed_user_id'); }
    public function book()           { return $this->belongsTo(Book::class); }
    public function exchangeRequest(){ return $this->belongsTo(ExchangeRequest::class); }
}
