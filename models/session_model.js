const { Schema, Mongoose } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var SessionSchema = new Schema({
    user:{
        user: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema",
        require: true
    },
    token: {
        String,
        require: true
    }
});

//Compiled model

var SessionModel = Mongoose.model('Sessions', SessionSchema);
module.exports = SessionModel;