const BoardManager = require('./board_manager');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const mediator = require('./mediator');
const {CheckToken} = require('./token_handler'); 

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
  wss.on('connection', async (ws, req) => {
    
    //Verificer bruger token
    const userId = await VerifyUserToken(ws, req);
    console.log("i am userid: ", userId);
    //Foretage handlinger baseret på forespørgelsen der modtages
    ws.on('message', (data) => {
      const json = JSON.parse(data);
      const request = json.request;
      console.log("",json);

      //Udfør operationer baseret på forespørgelsen
      switch (request) {
        case 'SUBSCRIBE_BOARD':
          boardManager.subscribeToBoard(ws, userId, json.boardId);
          break;
        case 'SUBSCRIBE_BOARD_COOKIE':
          boardManager.subscribeToBoardSession(ws, userId, json.boardId, json.lastEdited);
          break;
        case 'SUBSCRIBE_BOARD_LIST':
          boardManager.subscribeToBoardList(ws, userId);
          break;
        case 'NEW_BOARD':
          boardManager.createNewBoard(ws, userId, json.details);
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
          break;
        case 'DELETE_LIST':
          boardManager.deleteList(userId, json.boardId, json.listId);
          break;
        case 'DELETE_BOARD':
          boardManager.deleteBoard(userId, json.boardId);
          break;
        case 'DELETE_CARD':
          boardManager.deleteCard(userId, json.boardId, json.cardId);
          break;
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

async function VerifyUserToken(ws, req) {
  try {
    //Hvis brugeren ikke har en cookie, sluk forbindelsen
    if (!req.headers.cookie) return ws.close(1008, 'No cookie');

    const cookies = req.headers.cookie.split(';');
    let cookie = cookies.find(row => row.startsWith(' JWT='));

    if (!cookie) {
      cookie = cookies.find(row => row.startsWith('JWT='));
    }

    if (!cookie){
      return ws.close(1008, 'No token');
    } 

    //Hvis brugeren ikke har en token, sluk forbindelsen
    const token = cookie.split('=')[1];

    if (!token){
      return ws.close(1008, 'Access Denied');
    } 

    //TODO Hook up token handler

    /*const verified = jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded){
      console.log("I AM ERROR AGIEN: ", err);
      console.log("I AM DECODED: ", decoded);
    }); */  

    
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log("i am verifed: ", verified);
    req.user = verified;
    console.log("i am req.user: ", req.user);

    const check = await CheckToken(verified._id, token);
    console.log("i am check: ", check);
    if(!check.success){
      console.log("im closing!");
      return ws.close(1008, 'Access Denied');
    }


    console.log("i am returning");
    return verified._id;

  } catch (err) {
    console.log(err);
    return ws.close(1008, 'Invalid Token');
  }
}

exports.startWebscoketServer = startWebscoketServer;