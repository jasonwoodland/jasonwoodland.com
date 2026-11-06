.PHONY: serve up down check test deploy deploy-dry-run

PHP ?= php
PORT ?= 8766
DEPLOY_HOST ?= syd1
DEPLOY_PATH ?= /var/www/jasonwoodland.com/public/
DEPLOY_APP_PATH ?= /var/www/jasonwoodland.com/app/
RSYNC_EXTRA ?=

serve:
	$(PHP) -S 127.0.0.1:$(PORT) -t public scripts/router.php

up:
	PORT=$(PORT) docker compose up --build -d

down:
	docker compose down

check:
	docker compose exec -T web sh -c 'find app public -name "*.php" -exec php -l {} \;'
	node scripts/check.mjs

test:
	npm test

deploy-dry-run:
	$(MAKE) deploy RSYNC_EXTRA="--dry-run --itemize-changes"

deploy:
	rsync -az --no-owner --no-group --chmod=D755,F644 $(RSYNC_EXTRA) \
		--exclude='.DS_Store' \
		app/ $(DEPLOY_HOST):$(DEPLOY_APP_PATH)
	rsync -az --no-owner --no-group --chmod=D755,F644 $(RSYNC_EXTRA) \
		--exclude='/.well-known/' \
		--exclude='.DS_Store' \
		public/ $(DEPLOY_HOST):$(DEPLOY_PATH)
