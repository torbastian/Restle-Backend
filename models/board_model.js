const mongoose = require("mongoose");

//Schemas
var BoardSchema = new mongoose.Schema({
    create_date: {
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
    description: {
        type: String,
        require: false,
        default: ""
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }],

    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lists"
    }]
});

//Pre

BoardSchema.pre('save', { document : true }, async function() {
    this.last_edited = Date.now();
  });

//Compiled model

const BoardModel = mongoose.model('Boards', BoardSchema);
module.exports = BoardModel;