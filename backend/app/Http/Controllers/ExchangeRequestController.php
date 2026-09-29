<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExchangeRequest;
use App\Models\Book;

class ExchangeRequestController extends Controller
{
    // Send exchange request — requester must offer one of their own books
    public function send(Request $request)
    {
        $request->validate([
            'book_id'         => 'required|exists:books,id',
            'offered_book_id' => 'required|exists:books,id',
            'message'         => 'nullable|string|max:500',
        ]);

        $wantedBook  = Book::findOrFail($request->book_id);
        $offeredBook = Book::findOrFail($request->offered_book_id);

        // Cannot request your own book
        if ($wantedBook->user_id === $request->user()->id) {
            return response()->json(['message' => 'You cannot request your own book'], 422);
        }

        // Offered book must belong to requester
        if ($offeredBook->user_id !== $request->user()->id) {
            return response()->json(['message' => 'You can only offer your own books'], 422);
        }

        // Cannot offer the same book you are requesting
        if ($request->book_id === $request->offered_book_id) {
            return response()->json(['message' => 'Offered book and requested book cannot be the same'], 422);
        }

        // Check duplicate pending request
        $existing = ExchangeRequest::where('requester_id', $request->user()->id)
            ->where('book_id', $request->book_id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending request for this book'], 422);
        }

        $exchangeRequest = ExchangeRequest::create([
            'requester_id'    => $request->user()->id,
            'owner_id'        => $wantedBook->user_id,
            'book_id'         => $request->book_id,
            'offered_book_id' => $request->offered_book_id,
            'message'         => $request->message,
            'status'          => 'pending',
        ]);

        return response()->json([
            'message' => 'Exchange request sent successfully',
            'request' => $exchangeRequest->load(['book', 'offeredBook', 'requester:id,name']),
        ], 201);
    }

    // Requests I received as book owner
    public function received(Request $request)
    {
        $requests = ExchangeRequest::with([
            'book',
            'offeredBook',
            'requester:id,name,email,phone',
        ])
            ->where('owner_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['requests' => $requests]);
    }

    // Requests I sent
    public function sent(Request $request)
    {
        $requests = ExchangeRequest::with([
            'book',
            'offeredBook',
            'owner:id,name,email,phone',
        ])
            ->where('requester_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['requests' => $requests]);
    }

    // Owner accepts or rejects
    public function respond(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected',
        ]);

        $exchangeRequest = ExchangeRequest::find($id);

        if (!$exchangeRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($exchangeRequest->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $exchangeRequest->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Request ' . $request->status,
            'request' => $exchangeRequest->load(['book', 'offeredBook', 'requester:id,name']),
        ]);
    }

    // Requester cancels
    public function cancel(Request $request, $id)
    {
        $exchangeRequest = ExchangeRequest::find($id);

        if (!$exchangeRequest) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        if ($exchangeRequest->requester_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($exchangeRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be cancelled'], 422);
        }

        $exchangeRequest->delete();

        return response()->json(['message' => 'Request cancelled']);
    }

    // My own books — for offering in exchange
    public function myBooksForOffer(Request $request)
    {
        $books = Book::where('user_id', $request->user()->id)
            ->latest()
            ->get(['id', 'title', 'author', 'condition', 'image']);

        return response()->json(['books' => $books]);
    }
}
