<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class OtpVerification extends Model
{
    protected $fillable = ['email', 'otp', 'expires_at', 'used'];

    protected $casts = [
        'expires_at' => 'datetime',
        'used'       => 'boolean',
    ];

    public function isExpired(): bool
    {
        return Carbon::now()->isAfter($this->expires_at);
    }

    // Generate a fresh 5-digit OTP and save it
    public static function generate(string $email): self
    {
        // Delete old OTPs for this email
        static::where('email', $email)->delete();

        return static::create([
            'email'      => $email,
            'otp'        => str_pad(random_int(10000, 99999), 5, '0', STR_PAD_LEFT),
            'expires_at' => Carbon::now()->addMinutes(10),
            'used'       => false,
        ]);
    }
}
