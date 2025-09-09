<?php
// Simple file-based CRUD for "art" entities, no database required.
// Data path: src/data/arts.json (created on demand)

header('Content-Type: application/json; charset=UTF-8');

// Allow simple CORS for local file serving via PHP built-in server if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = dirname(__DIR__) . '/data';
$dataFile = $dataDir . '/arts.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}

function read_all_arts($dataFile) {
    if (!is_file($dataFile)) return [];
    $raw = file_get_contents($dataFile);
    if ($raw === false || $raw === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function write_all_arts($dataFile, $arts) {
    $fp = fopen($dataFile, 'c+');
    if (!$fp) return false;
    // Acquire exclusive lock
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }
    ftruncate($fp, 0);
    rewind($fp);
    $ok = fwrite($fp, json_encode($arts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $ok;
}

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Parse input
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';

if ($method === 'GET') {
    $list = read_all_arts($dataFile);
    if ($id !== '') {
        foreach ($list as $item) {
            if ((string)$item['id'] === (string)$id) {
                respond(200, $item);
            }
        }
        respond(404, [ 'error' => 'Not found' ]);
    }
    // Sort by createdAt desc by default
    usort($list, function($a, $b) {
        return strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? '');
    });
    respond(200, $list);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];

    $required = ['title', 'type', 'period', 'condition', 'description'];
    foreach ($required as $key) {
        if (!isset($input[$key]) || $input[$key] === '') {
            respond(400, [ 'error' => 'Missing field: ' . $key ]);
        }
    }

    $list = read_all_arts($dataFile);
    $newId = uniqid('art_', true);
    $item = [
        'id' => $newId,
        'title' => (string)$input['title'],
        'type' => (string)$input['type'],
        'period' => (string)$input['period'],
        'condition' => (string)$input['condition'],
        'description' => (string)$input['description'],
        'locationNotes' => isset($input['locationNotes']) ? (string)$input['locationNotes'] : '',
        'lat' => isset($input['lat']) ? (float)$input['lat'] : null,
        'lng' => isset($input['lng']) ? (float)$input['lng'] : null,
        'sensitive' => !empty($input['sensitive']),
        'privateLand' => !empty($input['privateLand']),
        'creditKnownArtist' => !empty($input['creditKnownArtist']),
        'image' => isset($input['image']) ? (string)$input['image'] : '',
        'createdAt' => gmdate('c')
    ];
    $list[] = $item;
    if (!write_all_arts($dataFile, $list)) {
        respond(500, [ 'error' => 'Failed to save' ]);
    }
    respond(201, $item);
}

if ($method === 'PUT') {
    if ($id === '') respond(400, [ 'error' => 'Missing id' ]);
    $list = read_all_arts($dataFile);
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = [];
    $found = false;
    foreach ($list as &$item) {
        if ((string)$item['id'] === (string)$id) {
            $found = true;
            foreach (['title','type','period','condition','description','locationNotes','lat','lng','sensitive','privateLand','creditKnownArtist','image'] as $k) {
                if (array_key_exists($k, $input)) {
                    $item[$k] = $input[$k];
                }
            }
            $item['updatedAt'] = gmdate('c');
            break;
        }
    }
    if (!$found) respond(404, [ 'error' => 'Not found' ]);
    if (!write_all_arts($dataFile, $list)) {
        respond(500, [ 'error' => 'Failed to save' ]);
    }
    respond(200, [ 'ok' => true ]);
}

if ($method === 'DELETE') {
    if ($id === '') respond(400, [ 'error' => 'Missing id' ]);
    $list = read_all_arts($dataFile);
    $new = [];
    $removed = false;
    foreach ($list as $item) {
        if ((string)$item['id'] === (string)$id) {
            $removed = true;
            continue;
        }
        $new[] = $item;
    }
    if (!$removed) respond(404, [ 'error' => 'Not found' ]);
    if (!write_all_arts($dataFile, $new)) {
        respond(500, [ 'error' => 'Failed to save' ]);
    }
    respond(200, [ 'ok' => true ]);
}

respond(405, [ 'error' => 'Method not allowed' ]);
?>


