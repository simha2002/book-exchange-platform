<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\ExchangeRequest;

class ReviewController extends Controller
{
    // Submit review after exchange
    public function store(Request $request)
    {
        $request->validate([
            'exchange_request_id' => 'required|exists:exchange_requests,id',
            'book_id'             => 'required|exists:books,id',
            'rating'              => 'required|integer|min:1|max:5',
            'comment'             => 'nullable|string|max:500',
        ]);

        $exchange = ExchangeRequest::find($request->exchange_request_id);
        $userId   = $request->user()->id;

        // Only parties of this exchange can review
        if ($exchange->requester_id !== $userId && $exchange->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only accepted exchanges
        if ($exchange->status !== 'accepted') {
            return response()->json(['message' => 'Can only review after exchange is accepted'], 422);
        }

        // Determine who is being reviewed
        $reviewedUserId = $exchange->requester_id === $userId
            ? $exchange->owner_id
            : $exchange->requester_id;

        // Check duplicate
        $existing = Review::where('exchange_request_id', $request->exchange_request_id)
            ->where('reviewer_id', $userId)->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this exchange'], 422);
        }

        $review = Review::create([
            'exchange_request_id' => $request->exchange_request_id,
            'reviewer_id'         => $userId,
            'reviewed_user_id'    => $reviewedUserId,
            'book_id'             => $request->book_id,
            'rating'              => $request->rating,
            'comment'             => $request->comment,
        ]);

        return response()->json([
            'message' => 'Review submitted successfully',
            'review'  => $review->load('reviewer:id,name,avatar'),
        ], 201);
    }

    // Get reviews for a book
    public function bookReviews($bookId)
    {
        $reviews = Review::with('reviewer:id,name,avatar')
            ->where('book_id', $bookId)
            ->latest()
            ->get();

        $avg = $reviews->avg('rating');

        return response()->json([
            'reviews' => $reviews,
            'average' => round($avg, 1),
            'total'   => $reviews->count(),
        ]);
    }

    // Get reviews for a user
    public function userReviews($userId)
    {
        $reviews = Review::with(['reviewer:id,name,avatar', 'book:id,title'])
            ->where('reviewed_user_id', $userId)
            ->latest()
            ->get();

        $avg = $reviews->avg('rating');

        return response()->json([
            'reviews' => $reviews,
            'average' => round($avg, 1),
            'total'   => $reviews->count(),
        ]);
    }
}
