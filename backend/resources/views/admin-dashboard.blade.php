<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body class="bg-light">

<div class="container mt-5">

<h1 class="text-center mb-4">
    📊 Admin Dashboard
</h1>

<div class="row">

<div class="col-md-3">
<div class="card text-center shadow">
<div class="card-body">
<h3>{{ $totalBooks }}</h3>
<p>Total Books</p>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card text-center shadow">
<div class="card-body">
<h3>{{ $totalUsers }}</h3>
<p>Total Users</p>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card text-center shadow">
<div class="card-body">
<h3>{{ $totalAdmins }}</h3>
<p>Total Admins</p>
</div>
</div>
</div>

<div class="col-md-3">
<div class="card text-center shadow">
<div class="card-body">
<h3>{{ $totalNormalUsers }}</h3>
<p>Normal Users</p>
</div>
</div>
</div>

</div>

<br>

<a href="/books" class="btn btn-primary">
    Back To Books
</a>

</div>

</body>
</html>