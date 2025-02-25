#!/bin/bash
cd /home/ubuntu/DebtManagementSystem/build/
pm2 start app.js
pm2 save
systemctl restart nginx