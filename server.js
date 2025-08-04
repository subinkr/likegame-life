const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 3001; // WebSocket용 별도 포트

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 새로운 채팅 서버 시작
  try {
    const { chatServer } = require('./src/lib/websocket.js');
    if (chatServer && typeof chatServer.initialize === 'function') {
      chatServer.initialize(wsPort);
      console.log('채팅 서버 초기화 성공');
    } else {
      console.error('채팅 서버를 찾을 수 없거나 initialize 메서드가 없습니다');
    }
  } catch (error) {
    console.error('채팅 서버 초기화 실패:', error);
  }

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Chat server on ws://${hostname}:${wsPort}`);
  });
}); 