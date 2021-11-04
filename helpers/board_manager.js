const { GetBoardList } = require("./board_handler");

class BoardManager {
  constructor() {
    this.boardSubscriptions = {};
  }

  async subscribeToBoardList(subscriber, userId) {
    try {
      console.log(userId);


    } catch (error) {

    }
  }
}

module.exports = BoardManager;