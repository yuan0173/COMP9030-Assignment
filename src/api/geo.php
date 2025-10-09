<?php
// Backend proxy for OpenStreetMap Nominatim (search and reverse geocoding).
// Rules:
// - Only call the official Nominatim host.
// - Set a proper User-Agent (configure NOMINATIM_USER_AGENT env var).
// - Apply basic input validation and small rate control.

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=UTF-8');

// CORS
$allowOrigin = getenv('CORS_ALLOW_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond_geo(int $status, $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function nominatim_get(string $path, array $query): array {
    $base = 'https://nominatim.openstreetmap.org';
    $url = $base . $path . '?' . http_build_query($query);

    // Basic rate courtesy (250ms)
    usleep(250000);

    $ua = getenv('NOMINATIM_USER_AGENT') ?: 'CityArts/1.0 (set NOMINATIM_USER_AGENT)';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en',
        ],
        CURLOPT_USERAGENT => $ua,
        CURLOPT_REFERER => ($_SERVER['HTTP_HOST'] ?? 'localhost'),
    ]);
    $body = curl_exec($ch);
    $err  = curl_error($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false) {
        respond_geo(502, ['error' => 'Upstream error', 'detail' => $err]);
    }
    $json = json_decode($body, true);
    if ($json === null) {
        // Try to pass raw body
        respond_geo($code >= 200 && $code < 300 ? 200 : $code, ['raw' => $body]);
    }
    respond_geo($code >= 200 && $code < 300 ? 200 : $code, $json);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    respond_geo(405, ['error' => 'Method not allowed']);
}

$action = isset($_GET['action']) ? (string)$_GET['action'] : '';
if ($action === 'search') {
    $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
    if ($q === '') respond_geo(400, ['error' => 'Missing q']);
    if ($limit < 1) $limit = 1;
    if ($limit > 10) $limit = 10;
    nominatim_get('/search', [
        'format' => 'json',
        'q' => $q,
        'limit' => $limit,
        'addressdetails' => 1,
    ]);
} elseif ($action === 'reverse') {
    $lat = isset($_GET['lat']) ? (float)$_GET['lat'] : 0.0;
    $lon = isset($_GET['lon']) ? (float)$_GET['lon'] : (isset($_GET['lng']) ? (float)$_GET['lng'] : 0.0);
    if ($lat < -90 || $lat > 90) respond_geo(400, ['error' => 'Invalid lat']);
    if ($lon < -180 || $lon > 180) respond_geo(400, ['error' => 'Invalid lon']);
    nominatim_get('/reverse', [
        'format' => 'json',
        'lat' => $lat,
        'lon' => $lon,
        'addressdetails' => 1,
    ]);
} else {
    respond_geo(400, ['error' => 'Unknown or missing action']);
}

?>

