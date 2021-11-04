const BoardManager = require('./board_manager');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

function startWebscoketServer(server) {
  const boardManager = new BoardManager();

  const wss = new WebSocket.Server({
    noServer: true,
    path: '/websockets'
  });

  //Opgrader forbindelsen til at håndtere websockets
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (websocket) => {
      wss.emit('connection', websocket, req);
    })
  });

  //Når en bruger forbindes til serveren
  wss.on('connection', (ws, req) => {
    //Verificer bruger token
    VerifyUserToken(ws, req);
    const userId = VerifyUserToken(ws, req);

    //Foretage handlinger baseret på forespørgelsen der modtages
    ws.on('message', (data) => {
      console.log(`recieved: ${data} from ${userId}`);
      const json = JSON.parse(data);
      const request = json.request;

      //Udfør operationer baseret på forespørgelsen
      switch (request) {
        case 'SUBSCRIBE':
          //TODO subscribe til board side
          break;
        case 'SUBSCRIBE_BOARD_LIST':
          boardManager.subscribeToBoardList(ws, userId);
          break;

        default:
          break;
      }
    });

    ws.on('close', () => {
      boardManager.unsubscribe(userId);
    });
  });

  return wss;
}

function VerifyUserToken(ws, req) {
  try {
    //Hvis brugeren ikke har en cookie, sluk forbindelsen
    if (req.headers.cookie == undefined) return ws.close(1008, 'No cookie');

    //Hvis brugeren ikke har en token, sluk forbindelsen
    const token = req.headers.cookie.substr(4, req.headers.cookie.length);
    if (!token) return ws.close(1008, 'Access Denied');

    //TODO Hook up token handler

    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    return verified._id;

  } catch (err) {
    console.log(err);
    return ws.close(1008, 'Invalid Token');
  }
}

exports.startWebscoketServer = startWebscoketServer;