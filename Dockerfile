FROM php:8.5-apache

RUN a2enmod rewrite headers \
    && printf 'ServerName localhost\n' > /etc/apache2/conf-available/server-name.conf \
    && a2enconf server-name

COPY docker/site.conf /etc/apache2/sites-available/000-default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/site.ini
COPY app/ /var/www/app/
COPY public/ /var/www/public/

WORKDIR /var/www
