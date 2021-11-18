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
    throw new Error("user eller admin fejlede " + err);
  }
}

async function AdminValidator(user_id) {
  try {
    const user = await User.findOne({ _id: user_id });

    return isAdmin(user);
  } catch (err) {
    console.log("owner eller admin validator fejlede");
    return false;
  }
}

async function MemberValidator(user_id, board_id) {
  try {
    const board = await Board.findOne({ _id: board_id });
    const user = await User.findOne({ _id: user_id });

    if (isAdmin(user) || isOwner(user_id, board) || isMember(user_id, board)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error("member validator fejlede" + err);
  }
}

async function isAdmin(user) {
  const userr = await User.findById(user);
  const result = userr.isAdmin;
  return result;
}

function isMember(user_id, board) {
  const result = board.members.includes(user_id);
  return result;
}

function isOwner(user_id, board) {
  const result = board.owner.toString() == user_id.toString();
  return result;
}

exports.OwnerAdminValidator = OwnerAdminValidator;
exports.AdminValidator = AdminValidator;
exports.MemberValidator = MemberValidator;
exports.isAdmin = isAdmin;
exports.isMember = isMember;
exports.isOwner = isOwner;