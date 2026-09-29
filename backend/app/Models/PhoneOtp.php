<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class PhoneOtp extends Model
{
    protected $fillable = ['phone', 'otp', 'expires_at', 'used'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used'       => 'boolean',
    ];

    public function isExpired(): bool
    {
        return Carbon::now()->isAfter($this->expires_at);
    }

    public static function generate(string $phone): self
    {
        static::where('phone', $phone)->delete();
        return static::create([
            'phone'      => $phone,
            'otp'        => str_pad(random_int(10000, 99999), 5, '0', STR_PAD_LEFT),
            'expires_at' => Carbon::now()->addMinutes(10),
            'used'       => false,
        ]);
    }
}
