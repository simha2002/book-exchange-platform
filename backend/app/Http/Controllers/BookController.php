<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Book;
use App\Models\User;

class BookController extends Controller
{
    public function getBooks(Request $request)
    {
        $query = Book::with('user:id,name,department');

        // Department filter
        if ($request->department && $request->department !== 'ALL') {
            $query->where('book_department', $request->department);
        }

        // Category filter
        if ($request->category && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        $books = $query->latest()->paginate(9);

        return response()->json($books);
    }

    public function addBook(Request $request)
    {
        $request->validate([
            'title'           => 'required|string|max:255',
            'author'          => 'required|string|max:255',
            'description'     => 'required|string',
            'condition'       => 'required|string|max:100',
            'category'        => 'nullable|string|max:100',
            'book_department' => 'nullable|string|max:20',
            'image'           => 'nullable|image|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('books', 'public');
        }

        $book = Book::create([
            'title'           => $request->title,
            'author'          => $request->author,
            'description'     => $request->description,
            'condition'       => $request->condition,
            'category'        => $request->category ?? 'Pass Papers',
            'book_department' => $request->book_department ?? 'ALL',
            'image'           => $imagePath,
            'user_id'         => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Book Added Successfully',
            'book'    => $book->load('user:id,name'),
        ], 201);
    }

    public function updateBook(Request $request, $id)
    {
        $book = Book::find($id);

        if (!$book) {
            return response()->json(['message' => 'Book Not Found'], 404);
        }

        if ($book->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $imagePath = $book->image;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('books', 'public');
        }

        $book->update([
            'title'       => $request->title ?? $book->title,
            'author'      => $request->author ?? $book->author,
            'description' => $request->description ?? $book->description,
            'condition'   => $request->condition ?? $book->condition,
            'category'    => $request->category ?? $book->category,
            'image'       => $imagePath,
        ]);

        return response()->json([
            'message' => 'Book Updated Successfully',
            'book'    => $book->load('user:id,name'),
        ]);
    }

    public function deleteBook(Request $request, $id)
    {
        $book = Book::find($id);

        if (!$book) {
            return response()->json(['message' => 'Book Not Found'], 404);
        }

        // Owner or admin can delete
        if ($book->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $book->delete();

        return response()->json(['message' => 'Book Deleted Successfully']);
    }

    public function findBook(Request $request)
    {
        $books = Book::with('user:id,name')
            ->where('title', 'LIKE', '%' . $request->title . '%')
            ->latest()
            ->paginate(9);

        return response()->json($books);
    }

    public function myBooks(Request $request)
    {
        $books = Book::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(9);

        return response()->json($books);
    }

    public function adminDashboard()
    {
        return response()->json([
            'totalBooks'       => Book::count(),
            'totalUsers'       => User::count(),
            'totalAdmins'      => User::where('role', 'admin')->count(),
            'totalNormalUsers' => User::where('role', 'user')->count(),
            'recentBooks'      => Book::with('user:id,name')->latest()->take(5)->get(),
        ]);
    }

    public function generateDescription(Request $request)
    {
        $request->validate(['title' => 'required|string']);

        $title = $request->title;
        $description = "{$title} is a wonderful book that provides deep insights and valuable knowledge on its subject matter. A great read for anyone looking to expand their understanding.";

        return response()->json(['description' => $description]);
    }
}
