#FROM debian:bullseye-slim
FROM dostorlinux/identifica-base:stable

COPY gate/ /var/www/html/gate
COPY certificados/dist/* /var/www/html/gate/portal/web/
COPY api.conf /etc/apache2/sites-enabled/api.conf
COPY portal.conf /etc/apache2/sites-enabled/portal.conf
COPY requirements.txt /root/
COPY start.sh /start.sh
COPY api.php /opt/localconfig/newstack/gate/api.php
RUN chmod +x /start.sh
WORKDIR /root
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get -y upgrade && apt-get -y install php-curl python3.9 apache2 php7.4 libapache2-mod-php7.4 \
    cmake wget curl php-cli php-zip unzip php-mbstring php-mysql php-gd ffmpeg libsm6 libxext6 libgl1-mesa-dev && a2enmod rewrite && \
    a2enmod headers&& \
    wget -O composer-setup.php https://getcomposer.org/installer && \
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer && \
    chmod +x /usr/local/bin/composer && apt autoclean

WORKDIR /var/www/html/gate/common
RUN composer update && composer install && composer require phpmailer/phpmailer && \
    composer require lcobucci/jwt && composer require tecnickcom/tcpdf && mkdir -p /opt/face_match/faces && chown -R www-data /opt/*



#WORKDIR /var/www/html/
#RUN cp -r dist/* /var/www/html/web/
#WORKDIR /var/www/html/gate/portal/front_angular/configIdentifica
#RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
#RUN apt-get update && apt-get install -y nodejs && npm install
#RUN npm install -g @angular/cli
#RUN ng build

WORKDIR /var/www/html/gate/api/face_match_server/

CMD ["/start.sh"]
