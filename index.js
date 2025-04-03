const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// 應用中間件（支援 CORS 和 JSON 解析）
server.use(middlewares);
server.use(jsonServer.bodyParser);

// 自訂路由（可選，若需額外邏輯）
server.use(router);

// 監聽端口 3000
server.listen(3000, () => {
  console.log('JSON Server is running on port 3000');
});