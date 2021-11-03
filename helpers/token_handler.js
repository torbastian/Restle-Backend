const mongoose = require("mongoose");
const tokenSchema = require("../models/session_model");
const jwt = require('jsonwebtoken');

//updatere token i session document
async function StartNewSession(userid, sessionToken){
    try{
        let result = await tokenSchema.updateOne({user: userid}, {token: sessionToken});
        if(result.matchedCount = 1){
            return{
                success: true,
                message: "bruger session er opdateret"
            };
        }else{
            return{
                success: false,
                message: "noget gik galt ingen session bliv updateret"
            };
        }
    }catch(err){
        return{
            success: false,
            message: "noget gik galt når vi forsøger at starte ny session"
        };
    }
}

async function DeleteSession(userid){
    let result = await tokenSchema.deleteOne({ user: userid });
    if(result.acknowledged){
        return{
            success: true,
            message: "Session blev slettet"
        };
    }else{
        return{
            success: false,
            message: "noget gik galt når vi forsøger at slette bruger session"
        };
    }
}

//checker om brugeren allerede er i session tabelen og om 
//de brugere samme session token
async function TokenHandler(userid, sessionToken){
    try{
        const check = await tokenSchema.findOne({user: userid});
    if (!check){
        return await CreateSession(userid, sessionToken);
    }else if(check.token == sessionToken){
        return{
            success: true,
            message: "bruger er logget ind" 
        };
    }else if(check.token != sessionToken){
        return await StartNewSession(userid, sessionToken);
    }else{
        return{
            success: false,
            message: "noget gik galt med session token" 
        };
    }
    }catch(err){
        console.log("TokenValidator Error: " + err);
        return{
            success: false,
            message: "Catch: noget gik galt" 
        };
    }
}

//skaber et ny session document  
async function CreateSession(userid, sessionToken){
    try{
        const session = new tokenSchema({
            user: userid,
            token: sessionToken
        });
        session.save();
        return {
            success: true,
            message: "session oprattet"
        };
    }catch(err){
        console.log("CreateSession Error: " + err);
        return {
            success: false,
            message: "opratte session fejlede"
        };
    }     
}

//validere en token ud fra en request cookie
async function validateToken(req, res, next) {
  const token = req.cookies.JWT;
  if (!token) return res.status(401).send({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;

    next();
  } catch (err) {
    res.status(400).send({ message: 'Invalid token' });
  }
}

exports.validateToken = validateToken;
exports.TokenHandler = TokenHandler;