const { Schema, Mongoose } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var SessionSchema = new Schema({
    user: mongoose.Schema.Types.ObjectId,
    ref: "UserSchema",
    token: String
});

//Compiled model

var SessionModel = Mongoose.model('Sessions', SessionSchema);