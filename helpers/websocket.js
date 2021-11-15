const BoardManager = require('./board_manager');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mediator = require('./mediator');

function startWebscoketServer(server) {
  const boardManager = new BoardManager();

  mediator.on('BoardUpdate', async function (boardId) {
    boardManager.sendBoard(boardId);
    boardManager.sendBoardListUpdate(boardId);
  });

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
    const userId = VerifyUserToken(ws, req);

    //Foretage handlinger baseret på forespørgelsen der modtages
    ws.on('message', (data) => {
      console.log(`recieved: ${data} from ${userId}`);
      const json = JSON.parse(data);
      const request = json.request;

      //Udfør operationer baseret på forespørgelsen
      switch (request) {
        case 'SUBSCRIBE_BOARD':
          boardManager.subscribeToBoard(ws, userId, json.boardId);
          break;
        case 'SUBSCRIBE_BOARD_LIST':
          boardManager.subscribeToBoardList(ws, userId);
          break;
        case 'NEW_BOARD':
          boardManager.createNewBoard(userId, json.details);
          break;
        case 'NEW_LIST':
          boardManager.createNewList(userId, json.boardId, json.details);
          break;
        case 'NEW_CARD':
          boardManager.createNewCard(userId, json.boardId, json.listId, json.details);
          break;
        case 'UPDATE_BOARD':
          boardManager.updateBoard(userId, json.boardId, json.details);
          break;
        case 'UPDATE_CARD':
          boardManager.updateCard(userId, json.boardId, json.cardId, json.details);
          break;
        case 'UPDATE_LIST':
          boardManager.updateList(userId, json.boardId, json.listId, json.details);
          break;
        case 'MOVE_LIST':
          boardManager.moveList(userId, json.boardId, json.listId, json.newIndex);
          break;
        case 'MOVE_CARD':
          boardManager.moveCard(userId, json.boardId, json.cardId, json.oldList, json.newList, json.destinationIndex);
        default:
          break;
      }
    });

    ws.on('close', () => {
      boardManager.unsubscribe(userId, ws);
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