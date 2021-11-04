const mongoose = require("mongoose");

//Schemas
var CardSchema = new mongoose.Schema({
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BoardSchema",
        require: true
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    last_edited: {
        type: Date,
        default: Date.now
    },
    title: {
        type: String,
        require: true
    },
    description: String,

    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    }]
});

//Compiled model
const CardModel = mongoose.model('card', CardSchema);
module.exports = CardModel;