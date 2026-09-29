<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\ExchangeRequestController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ReviewController;

// ── Public ──────────────────────────────────
Route::get('/test', fn() => response()->json(['message' => 'API Working']));
Route::post('/register',          [AuthController::class, 'register']);
Route::post('/verify-otp',        [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp',        [AuthController::class, 'resendOtp']);
Route::post('/login',             [AuthController::class, 'login']);
Route::get('/books',              [BookController::class, 'getBooks']);
Route::get('/search-book',        [BookController::class, 'findBook']);
Route::get('/reviews/book/{id}',  [ReviewController::class, 'bookReviews']);
Route::get('/reviews/user/{id}',  [ReviewController::class, 'userReviews']);

// ── Authenticated ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Profile
    Route::get('/profile',                  [UserController::class, 'profile']);
    Route::post('/profile/update',          [UserController::class, 'updateProfile']);
    Route::post('/profile/change-password', [UserController::class, 'changePassword']);

    // Books
    Route::post('/add-book',            [BookController::class, 'addBook']);
    Route::post('/books/{id}/update',   [BookController::class, 'updateBook']);
    Route::delete('/books/{id}',        [BookController::class, 'deleteBook']);
    Route::get('/my-books',             [BookController::class, 'myBooks']);
    Route::post('/generate-description',[BookController::class, 'generateDescription']);

    // Exchange
    Route::post('/exchange/send',           [ExchangeRequestController::class, 'send']);
    Route::get('/exchange/received',        [ExchangeRequestController::class, 'received']);
    Route::get('/exchange/sent',            [ExchangeRequestController::class, 'sent']);
    Route::get('/exchange/my-books',        [ExchangeRequestController::class, 'myBooksForOffer']);
    Route::put('/exchange/{id}/respond',    [ExchangeRequestController::class, 'respond']);
    Route::delete('/exchange/{id}/cancel',  [ExchangeRequestController::class, 'cancel']);

    // Chat
    Route::get('/chat/{exchangeId}',               [ChatController::class, 'messages']);
    Route::post('/chat/{exchangeId}/send',         [ChatController::class, 'send']);
    Route::post('/chat/{exchangeId}/meeting',      [ChatController::class, 'sendMeeting']);
    Route::get('/chat/unread/count',               [ChatController::class, 'unreadCount']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Admin
    Route::middleware('admin')->group(function () {
        Route::get('/admin-dashboard',          [BookController::class, 'adminDashboard']);
        Route::get('/admin/users',              [UserController::class, 'allUsers']);
        Route::put('/admin/users/{id}/role',    [UserController::class, 'changeRole']);
        Route::delete('/admin/users/{id}',      [UserController::class, 'deleteUser']);
        Route::get('/admin/exchanges',          [\App\Http\Controllers\AdminController::class, 'exchanges']);
        Route::get('/admin/book-reviews',       [\App\Http\Controllers\AdminController::class, 'bookReviews']);
        Route::get('/admin/owner-reviews',      [\App\Http\Controllers\AdminController::class, 'ownerReviews']);
    });
});
