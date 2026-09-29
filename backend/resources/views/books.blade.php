<!DOCTYPE html>

<html>
<head>
    <title>Book Exchange Platform</title>


<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">


</head>
<body class="bg-light">

<nav class="navbar navbar-dark bg-primary">
    <div class="container">
        <span class="navbar-brand mb-0 h1">
            📚 Book Exchange Platform
        </span>
    </div>
</nav>

<div class="container mt-4">


<div class="d-flex justify-content-between align-items-center mb-4">

    <h2>Available Books</h2>

   

    <a href="/book-form" class="btn btn-primary">
        + Add Book
    </a>
     <a href="/logout" class="btn btn-danger">
            Logout
        </a>
    </div>

</div>


<form action="/search-book" method="GET" class="mb-4">

    <div class="input-group">

        <input
            type="text"
            name="title"
            class="form-control"
            placeholder="Search Book Title">

        <button class="btn btn-success" type="submit">
            Search
        </button>

    </div>

</form>

<a href="/books" class="btn btn-secondary">
    All Books
</a>

<a href="/my-books" class="btn btn-info">
    My Books
</a>

<div class="row">

    @forelse($books as $book)

    <div class="col-md-4 mb-4">
        <div class="card shadow">

            <div class="card-body">

                <h5 class="card-title">
                    {{ $book->title }}
                </h5>

                <p><strong>ID:</strong> {{ $book->id }}</p>

                <p><strong>Author:</strong> {{ $book->author }}</p>

                <p><strong>Description:</strong> {{ $book->description }}</p>

                <p><strong>Condition:</strong> {{ $book->condition }}</p>

               <form action="/books/{{ $book->id }}" method="POST" style="display:inline;">

<p><strong>Condition:</strong> {{ $book->condition }}</p>

@if(session('user_role') == 'admin' || session('user_id') == $book->user_id)

<a href="/edit-book/{{ $book->id }}" class="btn btn-primary">
    Edit
</a>

<form action="/books/{{ $book->id }}" method="POST" style="display:inline;">
    @csrf
    @method('DELETE')

    <button type="submit" class="btn btn-danger">
        Delete
    </button>
</form>

@endif
            </div>

        </div>
    </div>

    @empty

    <div class="alert alert-danger">
        No Books Available
    </div>

    @endforelse

</div>


</div>

</body>
</html>
