# AWS 架設網站指南(中文版)
![圖片1](https://github.com/user-attachments/assets/a50a3907-1ac4-49c7-90f0-3249590cabf3)

本指南介紹如何在 AWS 上架設一個前後端分離的網站，使用兩台 EC2 實例（Amazon Linux 2023），前端使用 nginx 提供靜態檔案，後端使用 Node.js 和 pm2 運行 API。

---

## 1. 環境設置

- **AWS 資源**：
  - 2 台 EC2 實例（AMI：Amazon Linux 2023）
  - 前端端口：80（HTTP），443（HTTPS 可選）
  - 後端端口：3000
  - 2 個彈性 IP（Elastic IP）綁定到前後端實例

- **域名**：
  - 使用 Route 53 綁定域名（例如 `example.com` 和 `www.example.com`）到前端彈性 IP。

---

## 2. 前端設置

### 2.1 前端 UserData 腳本

以下是前端 EC2 實例的 UserData 腳本，用於安裝 nginx、拉取程式碼並配置服務：

```bash
#!/bin/bash
dnf update -y
dnf install -y nginx git curl wget
systemctl start nginx
systemctl enable nginx
mkdir -p /usr/share/nginx/html
cd /usr/share/nginx/html
git clone https://github.com/your-repo/your-frontend.git .
echo "
server {
    listen 80;
    server_name example.com www.example.com;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://your-backend-ip:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}" > /etc/nginx/conf.d/default.conf
systemctl restart nginx
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --reload


```


### 2.2 前端檔案
前端檔案放置在 /usr/share/nginx/html/，包含以下檔案：

- cart.html
- checkout.html
- index.html
- orders.html
- product-*.html
- vegetable.html
- styles.css
- index.js
- script.js -


## 3. 後端設置

### 3.1 後端 UserData 腳本
以下是後端 EC2 實例的 UserData 腳本，用於安裝 Node.js、pm2 並啟動 API：

```
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

```

### 3.2 後端檔案
後端檔案放置在 /app/，包含以下檔案：

- db.json
- package.json
- index.js（假設是後端進入點）

## 4. Route 53 域名綁定
在 Route 53 中創建託管區域（Hosted Zone）
為域名（例如 example.com 和 www.example.com）設置 A 記錄，指向前端的彈性 IP。

## 5. nginx 配置
前端的 nginx 配置文件位於 /etc/nginx/conf.d/default.conf，內容如下：
```
server {
    listen 80;
    server_name example.com www.example.com;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://your-backend-ip:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
## 6. 注意事項
將 example.com 和 www.example.com 替換為你的實際域名。
將 your-backend-ip 替換為後端 EC2 實例的私有 IP（或彈性 IP，如果後端也需要公開訪問）。
如果需要 HTTPS，建議使用 Let’s Encrypt 配置 SSL 憑證（參考後續步驟）

## 7. 可選：設置 HTTPS
7.1 安裝 certbot
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx

### 7.2 申請 SSL 憑證
certbot --nginx -d example.com -d www.example.com --non-interactive --agree-tos -m your-email@example.com

### 7.3 更新防火牆
firewall-cmd --add-port=443/tcp --permanent
firewall-cmd --reload

## 8. 測試
訪問 http://example.com  或  https://example.com  （如果設置了 HTTPS），確認前端頁面正常載入。
測試 API 請求，例如 curl http://example.com/api/，確認後端正常回應。




