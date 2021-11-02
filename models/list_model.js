const mongoose = require("mongoose");

//Schemas
var ListSchema = new mongoose.Schema; ({
    board: {
        board: mongoose.Schema.Types.ObjectId,
        ref: "BoardSchema",
        require: true
    },
    created_date: {
        Date,
        default: now()
    },
    last_edited: {
        Date,
        default: now()
    },
    title: {
        String,
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