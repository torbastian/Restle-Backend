const { Schema, Mongoose, mongo } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var ListSchema = new Schema({
    list_id: Number,
    board: mongoose.Schema.Types.ObjectId,
    ref: "BoardSchema",
    created_date: Date,
    last_edited: Date,
    title: String,
    cards:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CardSchema"
    }]
});

//Compiled model

var CardModel = Mongoose.model('Lists', ListSchema);