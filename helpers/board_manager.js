const Board = require("../models/board_model");
const { CreateBoard, GetBoard, GetBoardListAsOwner,
  GetBoardListAsMember, GetBoardList, EditBoard,
  DeleteBoard, GetAdminBoardOverview, AddMember, RemoveMember, ChangeOwner, RemoveMembers, LeaveBoard } = require("./board_handler");
const { CreateList, EditList, MoveList, DeleteList } = require("./list_handler");
const { CreateCard, EditCard, MoveCard, DeleteCard, AddCardMember, RemoveCardMembers, AddCardMembers } = require("./card_handler");
const { decrypt, decryptBoard } = require('./crypt');
const { sleep } = require('../helpers/sleep');

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
    await CreateList(userId, boardId, details.title, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.createNewList(userId, boardId, details, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async createNewCard(userId, boardId, listId, details, count = 0) {
    count++;
    await CreateCard(userId, boardId, listId, details.title, details.description, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.createNewCard(userId, boardId, listId, details, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async updateBoard(userId, boardId, details, count = 0) {
    count++;
    await EditBoard(userId, boardId, details.title, details.description, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.updateBoard(userId, boardId, details, count);
      } else if (result.success) {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
      }
    });
  }

  async updateCard(userId, boardId, cardId, details, count = 0) {
    count++;
    await EditCard(userId, boardId, cardId, details.title, details.description, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.updateCard(userId, boardId, cardId, details, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async updateList(userId, boardId, listId, details, count = 0) {
    count++;
    await EditList(userId, boardId, listId, details.title, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.updateList(userId, boardId, listId, details, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async moveList(userId, boardId, listId, newIndex, count = 0) {
    count++;
    await MoveList(userId, boardId, listId, newIndex, async (result) => {
      console.log(result, count);
      if (!result.success && result.status == "DB" && count < 5) {
        sleep(200 * count);
        this.moveList(userId, boardId, listId, newIndex, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async moveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, count = 0) {
    count++;
    await MoveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, async (result) => {
      console.log('Move card', result);
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.moveCard(userId, boardId, cardToMoveId, oldListId, newListId, destinationIndex, count);
      } else if (result.success) {

        this.sendBoard(boardId);
      }
    });
  }

  async deleteBoard(userId, boardId, count = 0) {
    count++;
    await DeleteBoard(boardId, userId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.deleteBoard(userId, boardId, count);
      } else if (result.success) {
        this.deleteBoardSubscription(boardId);
      }
    });
  }

  async deleteCard(userId, boardId, cardId, count = 0) {
    count++;
    await DeleteCard(userId, boardId, cardId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.deleteCard(userId, boardId, cardId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async deleteList(userId, boardId, listId, count = 0) {
    count++;
    await DeleteList(userId, boardId, listId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.deleteList(userId, boardId, listId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    });
  }

  async inviteToBoard(userId, boardId, memberId, count = 0) {
    count++;
    await AddMember(userId, boardId, memberId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.inviteToBoard(userId, boardId, memberId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
      }
    });
  }

  async inviteToCard(userId, boardId, cardId, memberId, count = 0) {
    count++;
    await AddCardMembers(userId, boardId, cardId, memberId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.inviteToCard(userId, boardId, cardId, memberId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    })
  }

  async removeFromCard(userId, boardId, cardId, members, count = 0) {
    count++;
    await RemoveCardMembers(userId, boardId, cardId, members, async (result) => {
      console.log(result);
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.removeFromCard(userId, boardId, cardId, members, count);
      } else if (result.success) {
        this.sendBoard(boardId);
      }
    })
  }

  async removeFromBoard(userId, boardId, members, count = 0) {
    count++;
    await RemoveMembers(userId, boardId, members, async (result) => {
      console.log(result);
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.removeFromBoard(userId, boardId, members, count = 0);
      } else if (result.success) {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
      }
    });
  }

  async leaveBoard(userId, boardId, count = 0) {
    count++;
    await LeaveBoard(userId, boardId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.leaveBoard(userId, boardId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
      }
    });
  }

  async transferOwnershipBoard(userId, boardId, newOwnerId, count = 0) {
    count++;
    await ChangeOwner(userId, boardId, newOwnerId, async (result) => {
      if (!result.success && result.status == "DB" && count < 5) {
        await sleep(200 * count);
        this.transferOwnershipBoard(userId, boardId, newOwnerId, count);
      } else if (result.success) {
        this.sendBoard(boardId);
        this.sendBoardListUpdate(boardId);
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
    memberOf.forEach(board => {
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