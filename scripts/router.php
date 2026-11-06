<?php
// Local preview router. Production uses the Apache configuration in docker/.
declare(strict_types=1);

$root = realpath(dirname(__DIR__) . '/public');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$file = realpath($root . $path);
if (!preg_match('~(?:^|/)\.~', $path) && $file && strpos($file, $root . DIRECTORY_SEPARATOR) === 0
    && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
    return false;
}
require $root . '/index.php';
