echo "Stopping Application"
pm2 delete all
systemctl stop nginx
