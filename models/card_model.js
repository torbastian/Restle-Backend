const { Schema, Mongoose, mongo, now } = require("mongoose");

//Schema Variables
var Schema = Mongoose.Schema;

//Schemas
var CardSchema = new Schema({
    board:{
        board: mongoose.Schema.Types.ObjectId,
        ref: "BoardSchema",
        require: true
    },
    created_date: {
        Date,
        default:now()
    },
    last_edited: {
        Date,
        default:now()
    },
    title: {
        String,
        require: true
    },
    description: String,

    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    }]
});

//Compiled model

var CardModel = Mongoose.model('Cards', CardSchema);
module.exports = CardModel;