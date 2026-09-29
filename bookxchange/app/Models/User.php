<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
        'role', 'phone', 'bio', 'avatar', 'is_blocked',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_blocked'        => 'boolean',
    ];

    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isBlocked(): bool  { return $this->is_blocked; }

    public function books()            { return $this->hasMany(Book::class); }
    public function sentRequests()     { return $this->hasMany(ExchangeRequest::class, 'requester_id'); }
    public function receivedRequests() { return $this->hasMany(ExchangeRequest::class, 'owner_id'); }
    public function notifications()    { return $this->hasMany(Notification::class)->latest(); }
    public function complaints()       { return $this->hasMany(Complaint::class, 'complainant_id'); }

    public function unreadNotificationsCount()
    {
        return $this->notifications()->where('is_read', false)->count();
    }
}
