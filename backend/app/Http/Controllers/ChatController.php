<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExchangeRequest;
use App\Models\ChatMessage;

class ChatController extends Controller
{
    public function messages(Request $request, $exchangeId)
    {
        $exchange = ExchangeRequest::find($exchangeId);
        if (!$exchange) return response()->json(['message' => 'Exchange not found'], 404);

        $userId = $request->user()->id;
        if ($exchange->requester_id !== $userId && $exchange->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($exchange->status !== 'accepted') {
            return response()->json(['message' => 'Chat only for accepted exchanges'], 422);
        }

        ChatMessage::where('exchange_request_id', $exchangeId)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = ChatMessage::with('sender:id,name,avatar')
            ->where('exchange_request_id', $exchangeId)
            ->oldest()->get();

        return response()->json([
            'messages' => $messages,
            'exchange' => $exchange->load([
                'requester:id,name,avatar,phone,email',
                'owner:id,name,avatar,phone,email',
                'book:id,title,author',
                'offeredBook:id,title,author',
            ]),
        ]);
    }

    // Send text message
    public function send(Request $request, $exchangeId)
    {
        $request->validate(['message' => 'required|string|max:1000']);

        $exchange = ExchangeRequest::find($exchangeId);
        if (!$exchange) return response()->json(['message' => 'Exchange not found'], 404);

        $userId = $request->user()->id;
        if ($exchange->requester_id !== $userId && $exchange->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($exchange->status !== 'accepted') {
            return response()->json(['message' => 'Chat only for accepted exchanges'], 422);
        }

        $msg = ChatMessage::create([
            'exchange_request_id' => $exchangeId,
            'sender_id'           => $userId,
            'message'             => $request->message,
            'message_type'        => 'text',
        ]);

        return response()->json(['message' => $msg->load('sender:id,name,avatar')], 201);
    }

    // Send meeting proposal
    public function sendMeeting(Request $request, $exchangeId)
    {
        $request->validate([
            'meeting_place' => 'required|string|max:100',
            'meeting_time'  => 'required|date|after:now',
        ]);

        $exchange = ExchangeRequest::find($exchangeId);
        if (!$exchange) return response()->json(['message' => 'Exchange not found'], 404);

        $userId = $request->user()->id;
        if ($exchange->requester_id !== $userId && $exchange->owner_id !== $userId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $place   = $request->meeting_place;
        $msgText = "📍 Meeting proposed at {$place} on " .
                   \Carbon\Carbon::parse($request->meeting_time, 'Asia/Kolkata')
                       ->format('D, d M Y h:i A') . ' (IST)';

        $msg = ChatMessage::create([
            'exchange_request_id' => $exchangeId,
            'sender_id'           => $userId,
            'message'             => $msgText,
            'message_type'        => 'meeting',
            'meeting_place'       => $place,
            'meeting_time'        => $request->meeting_time,
        ]);

        return response()->json(['message' => $msg->load('sender:id,name,avatar')], 201);
    }

    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;
        $exchangeIds = ExchangeRequest::where('status', 'accepted')
            ->where(function ($q) use ($userId) {
                $q->where('requester_id', $userId)->orWhere('owner_id', $userId);
            })->pluck('id');

        $count = ChatMessage::whereIn('exchange_request_id', $exchangeIds)
            ->where('sender_id', '!=', $userId)
            ->where('is_read', false)->count();

        return response()->json(['unread' => $count]);
    }
}
