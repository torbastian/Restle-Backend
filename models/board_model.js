const mongoose = require("mongoose");

//Schemas
var BoardSchema = new mongoose.Schema({
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
    owner: {
        owner: mongoose.Schema.Types.ObjectId,
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

var BoardModel = Mongoose.model('Boards', BoardSchema);
module.exports = BoardModel;