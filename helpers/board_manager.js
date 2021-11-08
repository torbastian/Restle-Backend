const { GetBoardAsOwner, GetBoardAsMember, CreateBoard, GetBoard } = require("./board_handler");

class BoardManager {
  constructor() {
    this.boardListSubscriptions = {};
    this.boardSubscriptions = {};
    //Hvis en user er i board list subscription, send hver board opdatering til user
  }

  async subscribeToBoardList(subscriber, userId) {
    try {
      //Hvis brugeren ikke er abbonneret, opret et abbonnoment
      if (!this.boardListSubscriptions[userId]) {
        this.boardListSubscriptions[userId] = {
          subscriber: subscriber
        }
      }


      /*
      //Pseudo kode til en mere opdateringsvenlig websocket løsning
      const boardLists = getBoardList();

      foreach board in boardlist {
        if (!boardListSubscriptions[boardId]) {
          boardListSubscriptions[boardId] = {
            subscribers: [subscriber]
          }
        } else {
          boardListSubscriptions[boardId].subscribers.push(subscriber);
        }
      }

      //Dette burde tillade et board på board listen, at opdatere via et event, 
      //uden at skulle gå igennem alle brugere på et board, 
      //hver gang det opdateres, og checke om brugeren er subscribed

      //Cons
      //Resultere i flere elementer i boardListSubscriptions, 1 per board, samnt x antal af brugere som er abboneret til boardet

      //Pros
      //Man behøver ikke at gå igennem hver bruger på et board hver gang det opdateres

      boardListSubscriptions[boardId] = {
        subscriber: subscriber
      }

      */
      this.sendBoardList(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  async subscribeToBoard(subscriber, userId, boardId) {
    console.log(boardId);
    try {
      const board = await GetBoard(boardId);
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
    await CreateBoard(details.title, userId, details.description);
  }

  //Send boards til bruger
  async sendBoardList(userId) {
    if (!this.boardListSubscriptions[userId]) return;

    const owned = await GetBoardAsOwner(userId);
    const memberOf = await GetBoardAsMember(userId);

    const listPackage = JSON.stringify({
      response: 'BOARD_LIST_RESPONSE',
      time: Date.now(),
      owned: owned,
      memberOf: memberOf
    });

    this.boardListSubscriptions[userId].subscriber.send(listPackage);
  }

  //Send board til brugere
  async sendBoard(boardId, subscriber = null) {
    if (this.boardSubscriptions[boardId]) {
      await GetBoard(boardId).then(result => {

        //Send et board til en specefik bruger, eller alle brugere ud fra om subscriber er null eller ej
        this.boardSubscriptions[boardId].subscribers.forEach(sub => {
          if ((subscriber && sub === subscriber) || !subscriber) {
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
    delete this.boardListSubscriptions[userId];

    //Gå igennem alle board subscriptions og fjern brugerens forbindelse
    for (var key in this.boardSubscriptions) {
      if (!this.boardSubscriptions.hasOwnProperty(key)) continue;

      const board = this.boardSubscriptions[key];
      const index = board.subscribers.indexOf(subscriber);

      if (index > -1) {
        this.boardSubscriptions[key].subscribers.splice(index, 1);
      }
    }
  }
}

module.exports = BoardManager;