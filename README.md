# jasonwoodland.com

A minimal personal website, rendered by PHP with English and Simplified Chinese pages. No framework, database, Composer dependencies, or frontend build step.

## Development

Start the PHP 8.5 / Apache container:

```sh
make up
```

Open <http://localhost:8766>. The app and public directory are mounted into the container, so edits appear on refresh. Use `make down` to stop it. Override the port with `make up PORT=8767`. Docker binds both IPv4 and IPv6 loopback addresses.

`npm run dev` starts the same container in the foreground; `npm start` runs it in the background. Node is only needed for the checks and tests.

With a working local PHP installation, you can also run `make serve` to use PHP’s development server and the small router in `scripts/router.php`, following the layout of `../gunghoe.com.au`.

## Layout

- `public/` is the document root: a PHP entry point and the images, fonts, CSS, and JavaScript.
- `app/site.php` contains the shared layout, page templates, routing, sitemap, and robots response.
- `app/content.php` contains the project descriptions, destinations, and shared social icons.
- `app/translations.php` contains the Simplified Chinese copy.
- `docker/` contains the Apache and PHP configuration. Only `public/` is exposed to HTTP.
- `scripts/` contains the local PHP router and Node checks/tests. It is never served publicly.

English URLs remain `/`, `/projects/`, `/contact/`, and `/projects/{slug}/`. Chinese equivalents live under `/zh/`. Every response contains only its requested language, including metadata, accessible labels, and internal links. Each page has its own canonical URL and reciprocal English/Chinese `hreflang` links; the sitemap includes both versions. Missing pages return HTTP 404 with `noindex`.

The language control is a real link to the matching page in the other language, so it works without JavaScript and can be opened in a new tab. JavaScript remembers the selection in local storage and suppresses entrance and page-transition animations for an ordinary language switch. The explicit URL determines the rendered language; stored preferences never override a shared link, and there are no automatic language redirects or locale query parameters.

The root text size is 112.5% of the browser default. Layout widths, type, icons, spacing, and lighting use rem units to scale together; at the usual default this gives an 18px body size and a 1080px maximum content width. Responsive breakpoints and fluid headings accommodate the larger scale.

`public/assets/site.js` makes the glass highlights follow nearby pointers, including a softer highlight on the StudyFrog slab. Reduced-motion settings keep the lighting stationary. Ordinary page navigation slides the outgoing content up 0.875rem while fading and blurring it over 220ms, then reveals the incoming elements with staggered blur entrances. The header stays steady. The incoming snapshot has no second fade, and rendering waits for the main content to be parsed. Fallback navigation retains its faded frame through pagehide and restores it on pageshow; cached pages keep their entrance state instead of rewinding visible content.

## Checks

With the container running, use Node.js 22 or newer:

```sh
npm run check
npm test
```

The checks lint PHP/JavaScript and request all 26 localized pages, checking metadata, language isolation, alternate links, internal destinations, image descriptions, and assets. Tests also cover redirects, 404 responses, private file isolation, navigation effects, and animation-free language links. Set `SITE_URL=http://127.0.0.1:8767` if using another port. PHP linting uses the running container.

## Deployment

Deploy to the existing Apache/PHP host:

```sh
make deploy-dry-run
make deploy
```

The target rsyncs private templates to `syd1:/var/www/jasonwoodland.com/app/` first, then public files to `syd1:/var/www/jasonwoodland.com/public/`. Override `DEPLOY_HOST`, `DEPLOY_PATH`, or `DEPLOY_APP_PATH` when needed. Uploads do not delete existing files, so legacy PDFs and other public assets remain available. The public `.htaccess` prioritises `index.php`, routes application URLs, preserves certificate challenges and the existing resume download header, and revalidates CSS/JavaScript. Templates also support the host’s PHP 7.3 syntax; local Docker uses PHP 8.5.

The Docker image copies the app and public files, so it also works without development mounts:

```sh
docker build -t jasonwoodland-site .
docker run -d --name jasonwoodland-site -p 127.0.0.1:8766:80 -p '[::1]:8766:80' jasonwoodland-site
```

Place your HTTPS reverse proxy in front of the container. Canonical URLs use `https://jasonwoodland.com`. For a separate PHP host, copy `app/` and `public/`, point its document root at `public/`, and route missing paths to `public/index.php` as shown in `docker/site.conf`. There is no static HTML generation step.

## Assets

Glass surfaces and lighting use prerendered, dithered PNGs in `public/assets/gradients/`. Regenerate them with `python3 scripts/render-gradients.py` (standard library only). Pointer lighting includes distance-based rim reflections with per-surface reflectivity; the StudyFrog buttons also have a diffuse overhead reflection.

StudyFrog’s app icon comes from its iOS app assets. Google Sans and Roboto Flex are self-hosted Latin subsets from Google Fonts; their OFL licences are included in `public/assets/fonts/`. The existing `bg.jpeg` and `bg2.jpeg` files are retained and unused.

The language symbol is from Google Material Icons, with its Apache 2.0 licence in `public/assets/icons/Material-Icons-LICENSE.txt`.
