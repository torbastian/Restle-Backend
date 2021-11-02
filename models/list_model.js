const mongoose = require("mongoose");

//Schemas
var ListSchema = new mongoose.Schema({
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
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CardSchema"
    }]
});

//Compiled model

var ListModel = mongoose.model('Lists', ListSchema);
module.exports = ListModel;