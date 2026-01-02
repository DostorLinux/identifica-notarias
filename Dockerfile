#FROM debian:bullseye-slim
FROM dostorlinux/identifica-base:stable

ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema incluyendo Node.js
RUN apt-get update && apt-get -y upgrade && apt-get -y install php-curl python3.9 apache2 php7.4 libapache2-mod-php7.4 \
    cmake wget curl php-cli php-zip unzip php-mbstring php-mysql php-gd ffmpeg libsm6 libxext6 libgl1-mesa-dev \
    ca-certificates gnupg && \
    # Instalar Node.js 18.x desde NodeSource
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    a2enmod rewrite && a2enmod headers && \
    wget -O composer-setup.php https://getcomposer.org/installer && \
    php composer-setup.php --install-dir=/usr/local/bin --filename=composer && \
    chmod +x /usr/local/bin/composer && apt autoclean

# Copiar y compilar la app Expo (certificados)
WORKDIR /tmp/certificados
COPY certificados/package*.json ./
RUN npm install
COPY certificados/ .
RUN npx expo export --platform web

# Copiar archivos al destino final
COPY gate/ /var/www/html/gate
RUN cp -r /tmp/certificados/dist/* /var/www/html/gate/portal/web/ && rm -rf /tmp/certificados

COPY api.conf /etc/apache2/sites-enabled/api.conf
COPY portal.conf /etc/apache2/sites-enabled/portal.conf
COPY requirements.txt /root/
COPY start.sh /start.sh
COPY api.php /opt/localconfig/newstack/gate/api.php
RUN chmod +x /start.sh
WORKDIR /root

WORKDIR /var/www/html/gate/common
RUN composer update && composer install && composer require phpmailer/phpmailer && \
    composer require lcobucci/jwt && composer require tecnickcom/tcpdf && mkdir -p /opt/face_match/faces && chown -R www-data /opt/*



WORKDIR /var/www/html/gate/api/face_match_server/

CMD ["/start.sh"]
