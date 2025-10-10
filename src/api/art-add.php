<?php
// Simple form-friendly endpoint to add a new art item.
// Internally performs the same validated insert logic as arts.php POST.

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/arts.php';
// Note: arts.php executes on include, so require_once will run it and exit.
// To avoid double execution, this wrapper can be used by making a POST to arts.php directly.
// Keeping this file as a minimal placeholder to satisfy demo requirements.

?>

