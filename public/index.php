<?php
declare(strict_types=1);

require dirname(__DIR__) . '/app/site.php';
respond($_SERVER['REQUEST_URI'] ?? '/');
