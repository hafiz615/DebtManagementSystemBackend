#!/bin/bash
cd /home/ubuntu/DebtManagementSystem/build/src/
pm2 start app.js
pm2 save
systemctl restart nginx