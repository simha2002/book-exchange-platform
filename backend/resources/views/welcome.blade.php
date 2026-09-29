<!DOCTYPE html>
<html>
<head>
    <title>Books List</title>
</head>
<body>

<h1>Books List</h1>



@foreach($books as $book)
    <div>
        <h3>{{ $book->title }}</h3>
        <p>Author: {{ $book->author }}</p>
        <p>Description: {{ $book->description }}</p>
        <p>Condition: {{ $book->condition }}</p>
        <hr>
    </div>
@endforeach

</body>
</html>