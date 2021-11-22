const mongoose = require("mongoose");
const Token = require("../models/session_model");
const jwt = require('jsonwebtoken');

//check token agienst DB
async function CheckToken(user_id, user_token){
  const token = await Token.findOne({$and:[{user: user_id}, {token: user_token}]});
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

async function CheckLoginToken(user_id, user_token){
  const check = await Token.findOne({user: user_id});
  
  if(!check){
    return await CreateToken(user_id, user_token);
  }else if(check.token != user_token){
    return await UpdateToken(user_id, user_token);  
  }else{
    return{
      success: true,
      message: "user id og token matcher database"
    }
  }
}
//create new token in DB
async function CreateToken(user_id, user_token){
  const token = await Token.findOne({$or:[{user: user_id}, {token: user_token}]});

  if(token){
    return{
      success: false,
      message: "token eller bruger findes allerede i databasen"
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
async function UpdateToken(user_id, user_token){
  const token = await Token.updateOne({user: user_id}, {token: user_token});

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

async function ValidateToken(req, res, next) {
  const token = req.cookies.JWT;

  if (!token){
    return res.status(401).send({ message: 'Access Denied' });
  } 

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;

    const checkToken = await CheckToken(req.user._id, token);

    if (!checkToken.success) {
      res.clearCookie('JWT').status(400).send({ message: 'Database error. Token not saved' });
      return;
    }

    next();
  } catch (err) {
    res.status(400).send({ message: 'Invalid token' });
  }
}

exports.UpdateToken = UpdateToken;
exports.CheckToken = CheckToken;
exports.CreateToken = CreateToken;
exports.ValidateToken = ValidateToken;
exports.CheckLoginToken = CheckLoginToken;