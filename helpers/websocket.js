const WebSocket = require('ws');

function startWebscoketServer(server) {
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/webscokets'
  });

  server.on('upgrade', (req, scoket, head) => {
    wss.handleUpgrade(request, socket, head, (websocket) => {
      wss.emit('connection', websocket, request);
    })
  });

  wss.on('connection', (ws, req) => {
    try {
      //Hvis brugeren ikke har en cookie, sluk forbindelsen
      if (req.headers.cookie == undefined) return ws.close(1008, 'No cookie');

      //Hvis brugeren ikke har en token, sluk forbindelsen
      const token = req.headers.cookie.substr(4, req.headers.cookie.length);
      if (!token) return ws.close(1008, 'Access Denied');

      const verified = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = verified;
    } catch (err) {
      console.log(err);
      return ws.close(1008, 'Invalid Token');
    }

    ws.on('message', (data) => {
      console.log(`recived: ${data}`);
      const json = JSON.parse(data);
      const request = json.request;
      const userId = json.userId;

      //Udfør operationer baseret på forespørgelsen
      switch (request) {
        case 'SUBSCRIBE':

          break;

        default:
          break;
      }
    });
  });

  ws.on('close', () => {
    console
  });

  return wss;
}

exports.startWebscoketServer = startWebscoketServer;