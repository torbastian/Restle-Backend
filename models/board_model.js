const { Schema, Mongoose, mongo } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var BoardSchema = new Schema({
    board_id: Number,
    created_date: Date,
    last_edited: Date,
    title: String,
    owner: mongoose.Schema.Types.ObjectId,
    ref: "UserSchema",

    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    }],

    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListSchema"
    }]
});

//Compiled model

var BoardModel = Mongoose.model('Boards', BoardSchema);