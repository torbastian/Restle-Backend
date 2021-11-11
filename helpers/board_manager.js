const { CreateBoard, GetBoard, GetBoardListAsOwner, GetBoardListAsMember, GetBoardList } = require("./board_handler");
const Board = require("../models/board_model");
const { CreateList } = require("./list_handler");
const { CreateCard } = require("./card_handler");

class BoardManager {
  constructor() {
    this.boardListSubscriptions = {};
    this.boardSubscriptions = {};
  }

  async subscribeToBoardList(subscriber, userId) {
    try {
      try {
        const _subscriber = { ws: subscriber, userId, userId };

        const ownedBoards = await GetBoardListAsOwner(userId);
        const memberBoards = await GetBoardListAsMember(userId);

        this.boardListSubscribe(ownedBoards.object, _subscriber);
        this.boardListSubscribe(memberBoards.object, _subscriber);

        this.sendBoardListToSubscriber(subscriber, ownedBoards.object, memberBoards.object);
      } catch (err) {
        console.log(err);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  //Hvis brugeren ikke er abbonneret til en board liste, opret et abbonnoment
  boardListSubscribe(boards, sub) {
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];

      if (!this.boardListSubscriptions[board._id]) {
        this.boardListSubscriptions[board._id] = {
          subscribers: [sub]
        }

        continue;
      }

      if (!this.boardListSubscriptions[board._id].subscribers.includes(sub)) {
        this.boardListSubscriptions[board._id].subscribers.push(sub);
      }
    }
  }

  async subscribeToBoard(subscriber, userId, boardId) {
    console.log(boardId);
    try {
      //const board = await GetBoard(boardId);
      //TODO Check om bruger er medlem, ejer eller admin

      //Hvis boardet ikke findes under boardSubscriptions, tilføj det
      if (!this.boardSubscriptions[boardId]) {
        this.boardSubscriptions[boardId] = {
          subscribers: []
        }
      }

      //Hvis brugeren ikke er abboneret til boardet, abboner brugeren
      if (!this.boardSubscriptions[boardId].subscribers.includes(subscriber)) {
        this.boardSubscriptions[boardId].subscribers.push(subscriber);
      }

      this.sendBoard(boardId, subscriber)
    } catch (error) {

    }
  }

  async createNewBoard(userId, details) {
    await CreateBoard(userId, details.title, userId, details.description);
  }

  async createNewList(userId, boardId, details) {
    await CreateList(userId, boardId, details.title, (result) => {
      console.log(result);
    });
  }

  async createNewCard(userId, boardId, listId, details) {
    console.log(userId);
    await CreateCard(userId, boardId, listId, details.title, details.description, (result) => {
      console.log(result);
    });
  }

  //Send et opdateret board til abonnerede brugers board lister
  async sendBoardListUpdate(boardId) {
    const subscriptions = this.boardListSubscriptions[boardId];

    if (!subscriptions) return;

    const board = await GetBoardList(boardId).object;

    subscriptions.forEach(sub => {
      if (board.owner == sub.userId) {
        const listUpdate = JSON.stringify({
          response: 'BOARD_LIST_UPDATE',
          time: Date.now(),
          owned: board
        })

        sub.ws.send(listUpdate);
      } else {
        const listUpdate = JSON.stringify({
          response: 'BOARD_LIST_UPDATE',
          time: Date.now(),
          memberOf: board
        })

        sub.ws.send(listUpdate);
      }
    });
  }

  async sendBoardListToSubscriber(subscriber, owned, memberOf) {
    const listPackage = JSON.stringify({
      response: 'BOARD_LIST_RESPONSE',
      time: Date.now(),
      owned: owned,
      memberOf: memberOf
    });

    subscriber.send(listPackage);
  }

  //Send board til brugere
  async sendBoard(boardId, subscriber = null) {
    if (this.boardSubscriptions[boardId]) {
      await GetBoard(boardId).then(result => {

        //Send et board til en specefik bruger, eller alle brugere ud fra om subscriber er null eller ej
        this.boardSubscriptions[boardId].subscribers.forEach(sub => {
          if (!result.success) {
            sub.send(JSON.stringify({
              response: 'BOARD_RESPONSE_ERROR',
              time: Date.now(),
              result: result
            }));
          } else if ((subscriber && sub === subscriber) || !subscriber) {
            sub.send(JSON.stringify({
              response: 'BOARD_RESPONSE',
              time: Date.now(),
              board: result.object
            }));
          }
        });
      });
    }
  }

  async unsubscribe(userId, subscriber) {
    //Gå igennem alle board subscriptions og fjern brugerens forbindelse
    for (var key in this.boardSubscriptions) {
      if (!this.boardSubscriptions.hasOwnProperty(key)) continue;

      const board = this.boardSubscriptions[key];
      const index = board.subscribers.indexOf(subscriber);

      if (index > -1) {
        this.boardSubscriptions[key].subscribers.splice(index, 1);
      }
    }

    const _sub = { ws: subscriber, userId: userId };

    //Gå igennem alle board list subscriptions og fjern brugerens forbindelse
    for (var key in this.boardListSubscriptions) {
      if (!this.boardListSubscriptions.hasOwnProperty(key)) continue;

      const board = this.boardListSubscriptions[key];
      const index = board.subscribers.indexOf(_sub);

      if (index > -1) {
        this.boardListSubscriptions[key].subscribers.splice(index, 1);
      }
    }
  }
}

module.exports = BoardManager;