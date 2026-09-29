<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $fillable = [
        'user_id', 'title', 'author', 'category',
        'description', 'condition', 'image', 'is_available',
        'book_department',
    ];

    protected $casts = ['is_available' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exchangeRequests()
    {
        return $this->hasMany(ExchangeRequest::class, 'requested_book_id');
    }
}
