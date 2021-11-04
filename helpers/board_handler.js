const Board = require("../models/board_model");

async function CreateBoard(title, owner, members = [], lists = []) {
  const newBoard = new Board({
    create_date: Date.now(),
    last_edited: Date.now(),
    title: title,
    owner: owner,
    members: members,
    lists: lists
  });

  try {
    await newBoard.save().then(savedBoard => {
      return {
        success: true,
        message: "board blev gemt",
        object: savedBoard
      }
    });
  } catch (err) {
    return {
      success: false,
      message: "board blev ikke gemt. " + err
    }
  }
}

async function DeleteBoard(id) {
  try {
    await Board.deleteOne({ _id: id });
    return {
      success: true,
      message: "board blev slettet"
    }
  } catch (err) {
    return {
      success: false,
      message: "board blev ikke slettet. " + err
    }
  }
}

async function EditBoard(id, title) {
  await Board.updateOne({ _id: id }, { title: title, last_edited: Date.now() }, (err, updated) => {
    if (err) {
      return {
        success: false,
        message: "board blev ikke updated"
      };
    } else {
      return {
        success: true,
        message: "board blev updatet",
        object: updated
      }
    }
  });
}

async function AddMember(board_id, member_id) {
  await Board.findOne({ _id: board_id }).then(board => {

    if (board.members.includes(member_id)) {
      return {
        success: false,
        message: "bruger er allerede medlem af board"
      };
    }

    try {
      board.members.push(member_id);
      await board.save().then(savedBoard => {
        return {
          success: true,
          message: "bruger er blevet medlem af board",
          object: savedBoard
        };
      })
    } catch (err) {
      return {
        success: false,
        message: "noget gik galt da vi forsøgte at tilføje medlem"
      };
    }
  });
}

async function RemoveMember(board_id, member_id) {

  await Board.findOne({ _id: board_id }).then(board => {

    if (board.owner == member_id) {
      return {
        success: false,
        message: "kan ikke fjerne board owner fra medlems liste"
      };
    }

    if (!board.members.includes(member_id))
      return { success: false, message: "Bruger blev ikke fundet" };

    try {
      board.members.pull(member_id);

      await board.save().then(savedBoard => {
        return {
          success: true,
          message: "bruger er blevet fjernet som medlem",
          object: savedBoard
        }
      });
    } catch (err) {
      return {
        success: false,
        message: "noget gik galt da vi forsøgte at fjerne medlem"
      }
    }
  });
}

async function AddBoardList(board_id, member_id) {
  await Board.findOne({ _id: board_id }).then(board => {

    if (board.members.includes(member_id))
      return { success: false, message: "bruger er allerede medlem af board" };

    try {
      board.members.push(member_id);
      await board.save();
      return {
        success: true,
        message: "bruger er blevet medlem af board",
        object: board
      };
    } catch (err) {
      return {
        success: false,
        message: "noget gik galt da vi forsøgte at tilføje medlem"
      };
    }
  });
}

async function RemoveList(board_id, member_id) {
  try {
    Board.findOne({ _id: board_id }).then(board => {
      if (board.owner == member_id) {
        return {
          success: false,
          message: "kan ikke fjerne board owner fra medlems liste"
        };
      } else if (board.members.includes(member_id)) {
        const index = board.members.indexOf(member_id);
        if (board.members.splice(index, 1).length == 0) {
          return {
            success: false,
            message: "medlem blev ikke fjernet"
          };
        } else {
          try {
            await board.save();
            return {
              success: true,
              message: "bruger er blevet fjernet som medlem",
              object: board
            }
          } catch (err) {
            return {
              success: false,
              message: "noget gik galt da vi forsøgte at fjerne medlem"
            }
          }
        }
      }
    });
  } catch (err) {
    return {
      success: false,
      message: "medlem blev ikke fjernet. " + err
    };
  }
}

exports.CreateBoard = CreateBoard;
exports.DeleteBoard = DeleteBoard;
exports.EditBoard = EditBoard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;