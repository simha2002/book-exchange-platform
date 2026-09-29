<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'role', 'phone', 'bio', 'avatar',
        'is_blocked', 'is_email_verified',
        'is_phone_verified', 'roll_number', 'department',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'  => 'datetime',
        'is_blocked'         => 'boolean',
        'is_email_verified'  => 'boolean',
        'is_phone_verified'  => 'boolean',
    ];

    public function books()            { return $this->hasMany(Book::class); }
    public function sentRequests()     { return $this->hasMany(ExchangeRequest::class, 'requester_id'); }
    public function receivedRequests() { return $this->hasMany(ExchangeRequest::class, 'owner_id'); }
    public function reviews()          { return $this->hasMany(Review::class, 'reviewed_user_id'); }
}
