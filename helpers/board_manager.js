const { GetBoardList, GetBoardAsOwner, GetBoardAsMember } = require("./board_handler");

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

  async sendBoardList(userId) {
    if (!this.boardListSubscriptions[userId]) return;

    const owned = await GetBoardAsOwner(userId);
    const memberOf = await GetBoardAsMember(userId);

    const listPackage = JSON.stringify({
      time: Date.now(),
      owned: owned,
      memberOf: memberOf
    });

    this.boardListSubscriptions[userId].subscriber.send(listPackage);
  }
}

module.exports = BoardManager;