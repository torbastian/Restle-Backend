const { GetBoardAsOwner, GetBoardAsMember } = require("./board_handler");

class BoardManager {
  constructor() {
    this.boardListSubscriptions = {};
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

      this.sendBoardList(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  //Send boards til bruger
  async sendBoardList(userId) {
    if (!this.boardListSubscriptions[userId]) return;

    const owned = await GetBoardAsOwner(userId);
    const memberOf = await GetBoardAsMember(userId);

    const listPackage = JSON.stringify({
      respone: 'BOARD_LIST_RESPONSE',
      time: Date.now(),
      owned: owned,
      memberOf: memberOf
    });

    this.boardListSubscriptions[userId].subscriber.send(listPackage);
  }

  async unsubscribe(userId) {
    delete this.boardListSubscriptions[userId];
  }
}

module.exports = BoardManager;