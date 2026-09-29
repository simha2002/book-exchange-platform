<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_requests', function (Blueprint $table) {
            $table->id();
            // Person who initiates the request
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');
            // Person who owns the wanted book
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            // Book requester wants
            $table->foreignId('requested_book_id')->constrained('books')->onDelete('cascade');
            // Book requester offers in exchange
            $table->foreignId('offered_book_id')->constrained('books')->onDelete('cascade');
            $table->text('message')->nullable();
            // requester_accepted: requester confirms after owner accepts
            $table->boolean('requester_accepted')->default(false);
            // owner_accepted: owner accepts the exchange offer
            $table->boolean('owner_accepted')->default(false);
            $table->enum('status', ['pending', 'accepted', 'rejected', 'completed'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_requests');
    }
};
