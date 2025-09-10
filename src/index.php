<?php
// Serve the Cycle 2 Home page as the site's homepage, ensuring relative assets resolve correctly.

header('Content-Type: text/html; charset=UTF-8');

$homePath = __DIR__ . '/cycle2/Pages/Home.html';
if (!is_file($homePath)) {
    http_response_code(404);
    echo 'Homepage not found.';
    exit;
}

$content = file_get_contents($homePath);
if ($content === false) {
    http_response_code(500);
    echo 'Failed to load homepage.';
    exit;
}

// Inject a <base> tag so that all relative links (CSS, images, anchors) resolve from cycle2/Pages/
if (stripos($content, '<base ') === false) {
    $baseHref = 'cycle2/Pages/';
    $content = preg_replace('/<head(\s*)>/i', '<head$1><base href="' . $baseHref . '">', $content, 1);
}

echo $content;
?>


