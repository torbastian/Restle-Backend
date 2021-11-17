const { CreateBoard, GetBoard, GetBoardListAsOwner, GetBoardListAsMember, GetBoardList, EditBoard, DeleteBoard, GetAdminBoardOverview } = require("./board_handler");
const Board = require("../models/board_model");
const { CreateList, EditList, MoveList, DeleteList } = require("./list_handler");
const { CreateCard, EditCard, MoveCard, DeleteCard } = require("./card_handler");
const { decrypt, decryptBoard } = require('./crypt');

class BoardManager {
  constructor() {
    this.boardListSubscriptions = {};
    this.boardSubscriptions = {};
  }

  async subscribeToBoardSession(subscriber, userId, boardId, lastEdited) {
    try {
      const board = await Board.findById(boardId);
      const cookieLastEdited = new Date(lastEdited).toString();
      const isBoardUpToDate = board.last_edited.toString() == cookieLastEdited;

      this.subscribeToBoard(subscriber, userId, boardId, !isBoardUpToDate);

      if (isBoardUpToDate) {
        const boardResponse = JSON.stringify({
          response: 'BOARD_UP_TO_DATE',
          time: Date.now()
        });

        subscriber.send(boardResponse);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async subscribeToBoardList(subscriber, userId) {
    try {
      try {
        const _subscriber = { ws: subscriber, userId: userId };

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
      const board_id = board._id;

      if (!this.boardListSubscriptions[board_id]) {
        this.boardListSubscriptions[board_id] = {
          subscribers: [sub]
        }

        continue;
      }

      if (!this.boardListSubscriptions[board_id].subscribers.includes(sub)) {
        this.boardListSubscriptions[board_id].subscribers.push(sub);
      }
    }
  }

  async subscribeToBoard(subscriber, userId, boardId, sendBoard = true) {
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

      if (sendBoard) {
        this.sendBoard(boardId, subscriber)
      }
    } catch (error) {
      console.log(error);
    }
  }

  async deleteBoardSubscription(boardId) {
    try {

      if (this.boardSubscriptions[boardId]) {
        this.sendBoardDelete(boardId, this.boardSubscriptions[boardId].subscribers);
        delete this.boardSubscriptions[boardId];
      }

      if (this.boardListSubscriptions[boardId]) {
        this.sendBoardDelete(boardId, this.boardListSubscriptions[boardId].subscribers);
        delete this.boardListSubscriptions[boardId];
      }
    } catch (error) {
      console.log(error);
    }
  }

  sendBoardDelete(boardId, subscribers) {
    try {
      if (!subscribers) return;

      subscribers.forEach(sub => {
        const boardDelete = JSON.stringify({
          response: 'BOARD_DELETE',
          time: Date.now(),
          boardId: boardId
        });

        sub.ws.send(boardDelete);
      })
    } catch (error) {
      console.log(error);
    }
  }

  async getAdminBoardOverview(userId, query, ws) {
    await GetAdminBoardOverview(userId, query, (result) => {
      if (result.success) {
        const response = JSON.stringify({
          response: 'ADMIN_BOARD_RESPONSE',
          time: Date.now(),
          result: result.object
        });

        ws.send(response);
      }
    })
  }

  async createNewBoard(ws, userId, details) {
    await CreateBoard(userId, details.title, userId, details.description, (result) => {
      if (result.success) {
        this.boardListSubscribe([result.object], { ws: ws, userId: userId });
        this.sendBoardListUpdate(result.object._id);
      }
    });
  }

  async createNewList(userId, boardId, details, count = 0) {
    count++;
    await CreateList(userId, boardId, details.title, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.createNewList(userId, boardId, details, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async createNewCard(userId, boardId, listId, details, count = 0) {
    count++;
    await CreateCard(userId, boardId, listId, details.title, details.description, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.createNewCard(userId, boardId, listId, details, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async updateBoard(userId, boardId, details, count = 0) {
    count++;
    await EditBoard(userId, boardId, details.title, details.description, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.updateBoard(userId, boardId, details, count);
      } else {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
      }
    });
  }

  async updateCard(userId, boardId, cardId, details, count = 0) {
    count++;
    await EditCard(userId, boardId, cardId, details.title, details.description, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.updateCard(userId, boardId, cardId, details, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async updateList(userId, boardId, listId, details, count = 0) {
    count++;
    await EditList(userId, boardId, listId, details.title, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.updateList(userId, boardId, listId, details, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async moveList(userId, boardId, listId, newIndex, count = 0) {
    count++;
    await MoveList(userId, boardId, listId, newIndex, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.moveList(userId, boardId, listId, newIndex, count);
      }
    });
  }

  async moveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, count = 0) {
    count++;
    await MoveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.moveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async deleteBoard(userId, boardId, count = 0) {
    count++;
    await DeleteBoard(boardId, userId, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.deleteBoard(userId, boardId, count);
      } else {
        this.deleteBoardSubscription(boardId);
      }
    });
  }

  async deleteCard(userId, boardId, cardId, count = 0) {
    count++;
    await DeleteCard(userId, boardId, cardId, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.deleteCard(userId, boardId, cardId, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  async deleteList(userId, boardId, listId, count = 0) {
    count++;
    await DeleteList(userId, boardId, listId, (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        this.deleteList(userId, boardId, listId, count);
      } else {
        this.sendBoard(boardId);
      }
    });
  }

  //Send et opdateret board til abonnerede brugers board lister
  async sendBoardListUpdate(boardId) {
    try {
      boardId = boardId.toString();
      const subscriptions = this.boardListSubscriptions[boardId]?.subscribers;

      if (!subscriptions) return;

      let board = await GetBoardList(boardId);


      if (!board.success) return;

      board = board.object;

      subscriptions.forEach(sub => {
        if (board.owner._id == sub.userId) {
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
      })
    } catch (err) {
      console.error(err);
    }
  }

  async sendBoardListToSubscriber(subscriber, owned, memberOf) {
    
   
      owned.forEach(board => {
			board = decryptBoard(board);
		});
    
    
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
    try {
      if (!this.boardSubscriptions[boardId]) return;

      await GetBoard(boardId).then(result => {
        
        console.log("SENDBOARD");

        

        //Send et board til en specefik bruger, eller alle brugere ud fra om subscriber er null eller ej
        this.boardSubscriptions[boardId].subscribers.forEach(sub => {
          if (!result.success) {
            sub.send(JSON.stringify({
              response: 'BOARD_RESPONSE_ERROR',
              time: Date.now(),
              result: result
            }));
          } else if ((subscriber && sub === subscriber) || !subscriber) {
            result.object = decryptBoard(result.object);
            sub.send(JSON.stringify({
              response: 'BOARD_RESPONSE',
              time: Date.now(),
              board: result.object
            }));
          }
        });
      });

    } catch (err) {
      console.error(err);
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