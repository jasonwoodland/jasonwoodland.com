<?php
declare(strict_types=1);

const ORIGIN = 'https://jasonwoodland.com';

$content = require __DIR__ . '/content.php';
$translations = require __DIR__ . '/translations.php';
$locale = 'en';

function escape(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function translate(string $text, ?string $key = null): string
{
    global $locale, $translations;
    return $locale === 'zh' ? ($translations[$key ?? $text] ?? $text) : $text;
}

function t(string $text, ?string $key = null): string
{
    return escape(translate($text, $key));
}

function localizedPath(string $path, ?string $language = null): string
{
    global $locale;
    return (($language ?? $locale) === 'zh' ? '/zh' : '') . $path;
}

function url(string $path): string
{
    return escape(localizedPath($path));
}

function arrow(): string
{
    return '<svg class="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
}

function external(string $destination, string $label, string $class = 'text-link'): string
{
    $icon = $class === 'button' ? '' : '<svg class="arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
    return '<a class="' . escape($class) . '" href="' . escape($destination) . '" target="_blank" rel="noopener noreferrer">' . t($label) . $icon . '</a>';
}

function enterText(string $html, int $delay = 0, bool $inline = false): string
{
    return '<span class="enter-layer' . ($inline ? ' enter-inline' : '') . '" data-enter style="--enter-delay: ' . $delay . 'ms">' . $html . '</span>';
}

function socialTarget(array $link): string
{
    return strpos($link['url'], 'https:') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function socials(string $class = '', ?int $delay = null): string
{
    global $content;
    $html = '<nav class="icon-links ' . escape($class) . '" aria-label="' . t('Elsewhere') . '"'
        . ($delay === null ? '' : ' data-enter style="--enter-delay: ' . $delay . 'ms"') . '>';
    foreach ($content['socialLinks'] as $link) {
        $html .= '<a href="' . escape($link['url']) . '"' . socialTarget($link)
            . ' aria-label="' . t($link['name']) . '" title="' . t($link['name']) . '">' . $link['icon'] . '</a>';
    }
    return $html . '</nav>';
}

function shell(string $title, string $description, string $path, string $body, string $page, bool $notFound = false, ?string $projectName = null): string
{
    global $locale;
    $other = $locale === 'en' ? 'zh' : 'en';
    $languageAction = $locale === 'en' ? 'Switch to Chinese / 切换到中文' : 'Switch to English / 切换到英文';
    ob_start();
    ?>
<!doctype html>
<html lang="<?= $locale === 'zh' ? 'zh-Hans' : 'en-AU' ?>" data-locale="<?= $locale ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="/assets/page-init.js" blocking="render"></script>
  <meta name="color-scheme" content="dark">
  <meta name="darkreader-lock">
  <meta name="theme-color" content="#101010">
  <meta name="description" content="<?= t($description) ?>">
  <title><?= t($title) ?></title>
<?php if ($notFound): ?>
  <meta name="robots" content="noindex">
<?php else: ?>
  <link rel="canonical" href="<?= ORIGIN . url($path) ?>">
  <link rel="alternate" hreflang="en" href="<?= ORIGIN . escape(localizedPath($path, 'en')) ?>">
  <link rel="alternate" hreflang="zh-Hans" href="<?= ORIGIN . escape(localizedPath($path, 'zh')) ?>">
  <link rel="alternate" hreflang="x-default" href="<?= ORIGIN . escape($path) ?>">
<?php endif; ?>
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= t($title) ?>">
  <meta property="og:description" content="<?= t($description) ?>">
  <meta property="og:url" content="<?= ORIGIN . url($path) ?>">
  <meta property="og:locale" content="<?= $locale === 'zh' ? 'zh_CN' : 'en_AU' ?>">
  <meta name="twitter:card" content="summary">
  <link rel="preload" href="/assets/fonts/google-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/roboto-flex-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/style.css?v=<?= substr(hash_file('sha256', dirname(__DIR__) . '/public/assets/style.css'), 0, 12) ?>">
  <link rel="expect" href="#main" blocking="render">
  <script src="/assets/site.js" type="module"></script>
</head>
<body class="<?= $page ?>">
  <a class="skip-link" href="#main"><?= t('Skip to content') ?></a>
  <div class="site-shell">
    <header class="site-header">
<?php if ($page === 'detail-page'): ?>
      <nav class="breadcrumbs" aria-label="<?= t('Breadcrumb') ?>">
        <a href="<?= url('/') ?>">Jason Woodland</a><span class="breadcrumb-separator" aria-hidden="true">/</span>
        <a href="<?= url('/projects/') ?>"><?= t('Projects') ?></a><span class="breadcrumb-separator" aria-hidden="true">/</span>
        <span class="breadcrumb-title breadcrumb-project" aria-current="page" title="<?= escape($projectName ?? '') ?>"><?= escape($projectName ?? '') ?></span>
      </nav>
<?php elseif ($page === 'projects-page' || $page === 'contact-page'): ?>
      <nav class="breadcrumbs" aria-label="<?= t('Breadcrumb') ?>"><a href="<?= url('/') ?>">Jason Woodland</a><span class="breadcrumb-separator" aria-hidden="true">/</span><h1 class="breadcrumb-title"><?= t($page === 'projects-page' ? 'Projects' : 'Contact') ?></h1></nav>
<?php endif; ?>
      <nav class="main-nav" aria-label="<?= t('Main navigation') ?>">
        <a href="<?= url('/projects/') ?>"<?= $page === 'projects-page' ? ' aria-current="page"' : ($page === 'detail-page' ? ' aria-current="location"' : '') ?>><?= t('Projects') ?></a>
        <a href="<?= url('/contact/') ?>"<?= $page === 'contact-page' ? ' aria-current="page"' : '' ?>><?= t('Contact') ?></a>
        <a class="language-toggle" href="<?= escape(localizedPath($path, $other)) ?>" data-locale-link="<?= $other ?>" hreflang="<?= $other === 'zh' ? 'zh-Hans' : 'en' ?>" lang="<?= $other === 'zh' ? 'zh-Hans' : 'en' ?>" aria-label="<?= escape($languageAction) ?>" title="<?= escape($languageAction) ?>">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
          <span class="language-current" aria-hidden="true"><?= $locale === 'zh' ? '中' : 'EN' ?></span>
        </a>
      </nav>
    </header>
    <main id="main" tabindex="-1"><?= $body ?></main>
<?php if ($page !== 'home-page' && $page !== 'contact-page'): ?>
    <footer class="site-footer"><span><a class="footer-name" href="<?= url('/') ?>">Jason Woodland</a> <?=date('Y')?></span><?= socials('footer-icons') ?></footer>
<?php endif; ?>
  </div>
</body>
</html>
    <?php
    return (string) ob_get_clean();
}

function home(): string
{
    return shell('Jason Woodland — Software Developer', 'Jason Woodland — Software developer from Melbourne', '/', '
    <section class="intro" aria-labelledby="intro-title">
      <h1 class="display-name enter-shell" id="intro-title">' . enterText('Jason Woodland') . '</h1>
      <div class="intro-bio">
        <p class="intro-greeting enter-shell">' . enterText(t('Hi, I’m a software developer from Melbourne.'), 60) . '</p>
        <p class="enter-shell">' . enterText(t('I’m usually building my own tools, travelling, or learning Chinese with ', 'intro.interests.start') . '<a href="' . url('/projects/studyfrog/') . '">StudyFrog</a>' . t('.', 'intro.interests.end'), 120) . '</p>
      </div>' . socials('intro-icons', 180) . '
    </section>', 'home-page');
}

function feature(): string
{
    global $content;
    return '<article class="feature" aria-labelledby="studyfrog-title">
      <a class="app-icon-link" href="https://studyfrog.app" target="_blank" rel="noopener noreferrer" aria-label="' . t('Visit StudyFrog website') . '">
        <img class="app-icon" src="/assets/studyfrog.png" alt="' . t('StudyFrog app icon: a green frog wearing a graduation cap') . '" width="56" height="56" fetchpriority="high">
      </a>
      <div class="feature-copy">
        <h2 id="studyfrog-title">StudyFrog: ' . t('AI-Powered Language Learning') . '</h2>
        <p>' . t($content['studyfrogDescription']) . '</p>
        <div class="feature-actions">' . external('https://studyfrog.app', 'Visit Website', 'button') . '
          <a class="button" href="' . url('/projects/studyfrog/') . '">' . t('About the project') . '</a>
        </div>
      </div>
    </article>';
}

function collection(): string
{
    global $content;
    $cards = '';
    $index = 0;
    foreach ($content['projects'] as $project) {
        if ($project['slug'] === 'studyfrog') continue;
        $cards .= '<li class="project-item" data-enter style="--enter-delay: ' . (140 + $index++ * 40) . 'ms">
          <a class="glass-card project-card" href="' . url('/projects/' . $project['slug'] . '/') . '">
            <div class="project-copy"><h3>' . escape($project['name']) . '</h3><p>' . t($project['summary']) . '</p></div>
            <svg class="project-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg>
          </a>
        </li>';
    }
    return shell('Projects — Jason Woodland', 'Personal projects, open-source tools, and client work by Jason Woodland', '/projects/', '
      <section class="collection" aria-label="' . t('Project collection') . '">
        <div class="collection-feature" data-enter>' . feature() . '</div>
        <section class="featured-works" aria-labelledby="featured-works-heading">
          <h2 class="featured-works-heading enter-shell" id="featured-works-heading">' . enterText(t('Featured works'), 100) . '</h2>
          <ul class="project-grid collection-grid">' . $cards . '</ul>
        </section>
      </section>', 'projects-page');
}

function contact(): string
{
    global $content;
    $links = '';
    foreach ($content['socialLinks'] as $index => $link) {
        $links .= '<li class="enter-shell">' . enterText('<a class="contact-link" href="' . escape($link['url']) . '"' . socialTarget($link)
            . ' aria-label="' . t($link['name'] . ': ' . $link['username']) . '">' . $link['icon']
            . '<span class="contact-username">' . escape($link['username']) . '</span></a>', $index * 65) . '</li>';
    }
    return shell('Contact — Jason Woodland', 'Contact Jason Woodland by email, or find him on GitHub, Instagram, and YouTube', '/contact/',
        '<ul class="contact-links" aria-label="' . t('Contact details') . '">' . $links . '</ul>', 'contact-page');
}

function detail(array $project, int $index): string
{
    global $content;
    $next = $content['projects'][($index + 1) % count($content['projects'])];
    $paragraphs = implode("\n", array_map(function ($paragraph) { return '<p>' . t($paragraph) . '</p>'; }, $project['paragraphs']));
    if (isset($project['note'])) {
        $paragraphs .= '<h2>' . t($project['note']) . '</h2><ul>'
            . implode('', array_map(function ($note) { return '<li>' . t($note) . '</li>'; }, $project['notes'])) . '</ul>';
    }
    if (isset($project['references'])) {
        $paragraphs .= '<div class="research-links">' . implode("\n", array_map(function ($reference) { return external($reference['url'], $reference['label']); }, $project['references'])) . '</div>';
    }
    return shell($project['name'] . ' — Jason Woodland', $project['description'], '/projects/' . $project['slug'] . '/', '
      <article class="project-detail">
        <header class="page-intro detail-intro">
          <p class="detail-eyebrow enter-shell">' . enterText(t($project['kind']), 40) . '</p>'
          . ($project['slug'] === 'studyfrog' ? '<div class="detail-app-icon-shell enter-shell">' . enterText('<img class="detail-app-icon" src="/assets/studyfrog.png" alt="' . t('StudyFrog app icon') . '" width="90" height="90">', 60) . '</div>' : '') . '
          <h1 class="page-title" data-enter style="--enter-delay: 80ms">' . escape($project['name']) . '</h1>
          <p class="page-description enter-shell">' . enterText(t($project['summary']), 140) . '</p>
          <div class="detail-actions" data-enter style="--enter-delay: 200ms">'
            . external($project['url'], !empty($project['source']) ? 'View on GitHub' : 'Visit Website', 'button')
            . (isset($project['extraLink']) ? external($project['extraLink']['url'], $project['extraLink']['label'], 'button') : '') . '
          </div>
        </header>
        <div class="detail-body" data-enter style="--enter-delay: 260ms">
          <div class="detail-section-label">' . t('About the project') . '</div>
          <div class="prose">' . $paragraphs . '</div>
        </div>
      </article>
      <nav class="project-pagination" aria-label="' . t('More projects') . '" data-enter style="--enter-delay: 320ms">
        <a class="quiet-link" href="' . url('/projects/') . '">' . arrow() . t('All projects') . '</a>
        <a class="next-project" href="' . url('/projects/' . $next['slug'] . '/') . '"><span>' . t('Next project') . '</span><strong>' . escape($next['name']) . '</strong>' . arrow() . '</a>
      </nav>', 'detail-page', false, $project['name']);
}

function notFound(): string
{
    return shell('Page not found — Jason Woodland', 'Return to Jason Woodland’s homepage or explore the projects', '/404/', '
      <section class="page-intro error-intro" data-enter><p class="detail-eyebrow">404</p><h1 class="page-title">' . t('Nothing here') . '</h1>
        <p class="page-description">' . t('This page may have moved, or the address isn’t quite right') . '</p>
        <a class="button" href="' . url('/') . '">' . t('Back home') . arrow() . '</a>
      </section>', 'error-page', true);
}

function pagePaths(): array
{
    global $content;
    return array_merge(['/', '/projects/', '/contact/'], array_map(function ($project) { return '/projects/' . $project['slug'] . '/'; }, $content['projects']));
}

function sitemap(): string
{
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
        . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";
    foreach (pagePaths() as $path) {
        foreach (['en', 'zh'] as $language) {
            $xml .= '  <url><loc>' . ORIGIN . localizedPath($path, $language) . '</loc>';
            foreach (['en' => 'en', 'zh-Hans' => 'zh', 'x-default' => 'en'] as $hreflang => $alternate) {
                $xml .= '<xhtml:link rel="alternate" hreflang="' . $hreflang . '" href="' . ORIGIN . localizedPath($path, $alternate) . '"/>';
            }
            $xml .= "</url>\n";
        }
    }
    return $xml . "</urlset>\n";
}

function respond(string $request): void
{
    global $locale, $content;
    $path = rawurldecode(parse_url($request, PHP_URL_PATH) ?: '/');
    $locale = $path === '/zh' || strpos($path, '/zh/') === 0 ? 'zh' : 'en';
    $base = $locale === 'zh' ? (substr($path, 3) ?: '/') : $path;
    $canonical = substr($base, -11) === '/index.html' ? substr($base, 0, -10) : (rtrim($base, '/') . '/');

    if (in_array($canonical, pagePaths(), true) && $path !== localizedPath($canonical)) {
        header('Location: ' . localizedPath($canonical), true, 308);
        return;
    }
    if ($path === '/robots.txt') {
        header('Content-Type: text/plain; charset=utf-8');
        echo "User-agent: *\nAllow: /\n\nSitemap: " . ORIGIN . "/sitemap.xml\n";
        return;
    }
    if ($path === '/sitemap.xml') {
        header('Content-Type: application/xml; charset=utf-8');
        echo sitemap();
        return;
    }

    header('Content-Type: text/html; charset=utf-8');
    header('Content-Language: ' . ($locale === 'zh' ? 'zh-Hans' : 'en-AU'));
    header('Cache-Control: no-cache');
    $html = null;
    switch ($base) {
        case '/': $html = home(); break;
        case '/projects/': $html = collection(); break;
        case '/contact/': $html = contact(); break;
    }
    if ($html === null) {
        foreach ($content['projects'] as $index => $project) {
            if ($base === '/projects/' . $project['slug'] . '/') {
                $html = detail($project, $index);
                break;
            }
        }
    }
    if ($html === null) {
        http_response_code(404);
        $html = notFound();
    }
    echo $html;
}
