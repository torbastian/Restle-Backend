const User = require("../models/user_model")
const Board = require("../models/board_model");

async function OwnerAdminValidator(user_id, board_id) {
  try {
    const board = await Board.findOne({ _id: board_id });
    const user = await User.findOne({ _id: user_id });

    if (isAdmin(user) || isOwner(user._id, board)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error("user eller admin fejlede");
  }
}

async function AdminValidator(user_id) {
  try {
    const user = await User.findOne({ _id: user_id });

    return isAdmin(user);
  } catch (err) {
    throw new Error("owner eller admin validator fejlede");
  }
}

async function MemberValidator(user_id, board_id) {
  try {
    const board = await Board.findOne({ _id: board_id });

    if (isAdmin(user) || isOwner(user_id, board) || isMember(user_id, board)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {

  }
}

function isAdmin(user) {
  return user.isAdmin;
}

function isMember(user_id, board) {
  return board.members.includes(user_id);
}

function isOwner(user_id, board) {
  return board.owner == user_id;
}

exports.OwnerAdminValidator = OwnerAdminValidator;
exports.AdminValidator = AdminValidator;
exports.MemberValidator = MemberValidator;
exports.isAdmin = isAdmin;
exports.isMember = isMember;
exports.isOwner = isOwner;