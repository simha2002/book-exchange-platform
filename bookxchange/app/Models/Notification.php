<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'type', 'title', 'message', 'link', 'is_read'];
    protected $casts    = ['is_read' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }

    public static function send(int $userId, string $type, string $title, string $message, ?string $link = null): void
    {
        static::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'link'    => $link,
        ]);
    }
}
