const { Schema, Mongoose, mongo, now } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var ListSchema = new Schema({
    board:{
        board: mongoose.Schema.Types.ObjectId,
        ref: "BoardSchema"
    },
    require: true,
    created_date: Date,
    default:now(),
    last_edited: Date,
    default:now(),
    title: String,
    require: true,
    cards:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CardSchema"
    }]
});

//Compiled model

var CardModel = Mongoose.model('Lists', ListSchema);