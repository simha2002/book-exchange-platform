<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            // message_type: 'text' | 'meeting'
            $table->enum('message_type', ['text', 'meeting'])->default('text')->after('message');
            $table->string('meeting_place')->nullable()->after('message_type');
            $table->dateTime('meeting_time')->nullable()->after('meeting_place');
        });
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['message_type', 'meeting_place', 'meeting_time']);
        });
    }
};
