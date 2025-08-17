#!/bin/bash
sed -i "s/DBHOST/$DBHOST/g" /opt/localconfig/newstack/gate/api.php
sed -i "s/DBNAME/$DBNAME/g" /opt/localconfig/newstack/gate/api.php
sed -i "s/DBUSER/$DBUSER/g" /opt/localconfig/newstack/gate/api.php
sed -i "s/DBPASS/$DBPASS/g" /opt/localconfig/newstack/gate/api.php
sed -i "s|<title>.*</title>|<title>$APP_TITLE</title>|" /var/www/html/gate/portal/web/index.html
/etc/init.d/apache2 start
uwsgi --http 0.0.0.0:5000 --master -p 4 --logto2 /var/log/identifica.log -w app:app
#while true; do
#  php -f /var/www/html/gate/opq/src/opq_consumer.php xps 0
#  sleep 3
#done
