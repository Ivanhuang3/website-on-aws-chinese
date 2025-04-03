# website-on-aws-chinese
前後端網站建立在雲端(中文版)
![圖片1](https://github.com/user-attachments/assets/a50a3907-1ac4-49c7-90f0-3249590cabf3)
1.
進入AWS環境並且開立機器:
Instanse * 2(前後端)
AMI:AWS Linux 2023
前端機器綁彈性IP
前端-Port:80、443、22
後端-Port:3000、22(IP皆僅限前端，從前端跳進來)

前端userdata:
#!/bin/bash
dnf update -y
dnf install -y nginx git curl wget
systemctl start nginx
systemctl enable nginx
mkdir -p /var/www/html
cd /var/www/html
git clone https://github.com/your-repo/your-frontend.git .
echo "
server {
    listen 80;
    server_name your_domain_or_ip;
    location / {
        root /var/www/html;
        try_files \$uri \$uri/ /index.html;
    }
}" > /etc/nginx/conf.d/default.conf
systemctl restart nginx
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --reload

後端userdata:
#!/bin/bash
dnf update -y
dnf install -y curl wget git
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
npm install -g pm2
mkdir -p /app
cd /app
git clone https://github.com/your-repo/your-backend.git .
npm install
pm2 start index.js --name "backend"
pm2 save
pm2 startup systemd
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --reload

2.進入到前端機器 (/usr/share/nginx/html/)：
cart.html
checkout.html
index.html
orders.html
product-*.html
vegetable.html
styles.css
index.js
script.js

3.進入到後端機器 (/app/)：
db.json
package.json
index.js 

4.進入Route53
將自己的網域建立紀錄:
紀錄名稱打:www
IP打:彈性IP

5.回到前端機器(/etc/nginx/conf.d/):
server {
    listen 80;
    server_name example.com www.example.com;  # 替換為你的域名

    # 靜態檔案路徑
    root /usr/share/nginx/html;
    index index.html;

    # 處理 SPA（單頁應用）的路由
    location / {
        try_files $uri $uri/ /index.html;  # 如果是 SPA，確保所有路由都指向 index.html
    }

    # 如果前端需要與後端 API 互動，設置反向代理
    location /api/ {
        proxy_pass http://your-backend-ip:3000/;  # 替換為後端 IP 和端口
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 可選：錯誤頁面
    error_page 404 /404.html;
    location = /404.html {
        internal;
    }
}

6.最後sudo systemctl restart nginx
即完成
