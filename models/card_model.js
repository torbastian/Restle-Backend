const { Schema, Mongoose, mongo } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var CardSchema = new Schema({
    card_id: Number,
    board: mongoose.Schema.Types.ObjectId,
    ref: "BoardSchema",
    created_date: Date,
    last_edited: Date,
    title: String,
    description: String,

    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    }]
});

//Compiled model

var CardModel = Mongoose.model('Cards', CardSchema);