<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRequest;
use App\Models\Review;

class AdminController extends Controller
{
    // All exchange requests
    public function exchanges()
    {
        $exchanges = ExchangeRequest::with([
            'requester:id,name,email,roll_number',
            'owner:id,name,email,roll_number',
            'book:id,title,author',
            'offeredBook:id,title,author',
        ])->latest()->get();

        return response()->json(['exchanges' => $exchanges]);
    }

    // All book reviews
    public function bookReviews()
    {
        $reviews = Review::with([
            'reviewer:id,name,roll_number',
            'reviewedUser:id,name,roll_number',
            'book:id,title,author',
        ])->latest()->get();

        return response()->json(['reviews' => $reviews]);
    }

    // All owner/user reviews
    public function ownerReviews()
    {
        $reviews = Review::with([
            'reviewer:id,name,roll_number',
            'reviewedUser:id,name,roll_number',
            'book:id,title,author',
        ])->latest()->get();

        // Group by reviewed user
        $grouped = $reviews->groupBy('reviewed_user_id')->map(function ($userReviews) {
            $first = $userReviews->first();
            return [
                'user'    => $first->reviewedUser,
                'avg'     => round($userReviews->avg('rating'), 1),
                'total'   => $userReviews->count(),
                'reviews' => $userReviews->values(),
            ];
        })->values();

        return response()->json(['grouped' => $grouped]);
    }
}
