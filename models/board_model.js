const mongoose = require("mongoose");

//Schemas
var BoardSchema = new mongoose.Schema({
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
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserSchema"
    }],

    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListSchema"
    }]
});

//Compiled model

var BoardModel = mongoose.model('Boards', BoardSchema);
module.exports = BoardModel;