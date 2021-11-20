const jwt = require('jsonwebtoken');
const User = require('../models/user_model');
const Board = require('../models/board_model');
const BoardHandler = require('./board_handler');
const { hash, encrypt, decrypt } = require('./crypt');
const {UpdateToken, CreateToken, CheckLoginToken } = require('./token_handler');
const { AdminSelfValidator } = require("./Permission_validator");
const Lock = require("./lock_model");

async function signUserToken(user, res) {
  try {
    const seed = Date.now();
    const token = jwt.sign({ _id: user._id, seed: seed }, process.env.TOKEN_SECRET);

    const check = await CheckLoginToken(user._id, token);

    res.cookie('JWT', token, {
      maxAge: 86_400_800,
      httpOnly: true,
      sameSite: 'lax'
    }).send(getUserInfo(user));
  } catch (error) {
    console.log(error);
  }
}

function getUserInfo(user) {
  return JSON.stringify({
    _id: user._id,
    username: user.username,
    create_date: user.create_date,
    first_name: user.first_name,
    last_name: decrypt(user.last_name),
    email: user.email,
    colour: user.colour,
    isAdmin: user.isAdmin
  });
}

function newUser(reqUser) {
  //Hash og salt password
  const hashedPassword = hash(reqUser.password);

  //Opret bruger
  const user = new User({
    username: reqUser.username,
    password: hashedPassword,
    first_name: reqUser.first_name,
    last_name: encrypt(reqUser.last_name),
    email: reqUser.email,
    colour: reqUser.colour
  });

  return user;
}

async function DeleteUser(userToDelete_id, callback){



  /*if(AdminSelfValidator(user_id, userToDelete_id)){
    callback({
      success:false,
      message: "brugern er ikke admin, eller ikke forsøger at slette sig selv"
    });
    return;
  }*/

  
  const userToDelete = await User.findOne({_id: userToDelete_id});
  console.log("userToDelete: ", userToDelete);
  const boards = await Board.find({owner: userToDelete._id});

  console.log("DeleteUser userToDelete found: ", userToDelete);
  console.log("DeleteUser boards found: ", boards);
  if(boards){
    await deleteUserBoards(boards, userToDelete._id, function(result){
      console.log("DeleteUser boards found: ", result);
      if(result.success){
        userToDelete.deleteOne();
      }else{
        console.log("you are fucked!");
      }
      
    })
  }

  console.log("DeleteUser is Deleting user");
  
}

async function deleteUserBoards(boards, user_id, callback, count = 0){
  count++;
  if(Array.isArray(boards)){
    for(let i = 0; i < boards.length; i++){
      console.log("board " + i + " is being called in BoardHandler");
      await BoardHandler.DeleteBoard(boards[i]._id, user_id, async function(result){
        console.log("deleteUserBoards result: ", result);
      });
    }
  
    callback({
      success: true,
      message: "boards slettet"
    })
  }else{
    BoardHandler.DeleteBoard(boards._id, user_id, async function(result){
      console.log("deleteUserBoards result: ", result);
    });
  }
}

exports.newUser = newUser;
exports.getUserInfo = getUserInfo;
exports.signUserToken = signUserToken;
exports.DeleteUser = DeleteUser;