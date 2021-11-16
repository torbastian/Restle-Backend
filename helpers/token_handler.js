const mongoose = require("mongoose");
const Token = require("../models/session_model");
const jwt = require('jsonwebtoken');

//check token agienst DB
function CheckToken(user_id, user_token){
  const token = Token.findOne({$and:[{user: user_id}, {token: user_token}]});
  if(token){
    return{
      success: true,
      message: "user id og token matcher database"
    }
  }else{
    return{
      success: false,
      message: "user id og token findes ikke i database"
    }
  }
}
//create new token in DB
function CreateToken(user_id, user_token){
  const token = Token.findOne({$or:[{user: user_id}, {token: user_token}]});

  if(token){
    return{
      success: false,
      message: "token eller bruger findes allerede i databasem"
    }
  }else{
    try{
      newToken = new Token({
        user: user_id,
        token: user_token
      });
      newToken.save();
  
      return{
        success: true,
        message: "token er sat for brugere " + user_id,
        object: newToken
      }
    }catch(err){
      return{
        success: false,
        message: "noget gik galt. " + err
      }
    }
  }
}

//update Token in DB
function UpdateToken(user_id, user_token){
  const token = Token.updateOne({user: user_id}, {token: user_token});

  if(token){
    return{
      success: true,
      message: "token blev updateret på user " + user_id,
      object: token
    }
  }else{
    return{
      success: false,
      message: "noget gik galt da vi prøvede at update token"
    }
  }
}

exports.UpdateToken = UpdateToken;
exports.CreateToken = CreateToken;
exports.CheckToken = CheckToken;