const mongoose = require("mongoose");
const Card = require("../models/card_model");
const lockRelease = require('mongoose-lock-release');
const Lock = require("../helpers/lock_model");
const Board = require('../models/board_model');
const mediator = require('../helpers/mediator');

//Schemas
var ListSchema = new mongoose.Schema({
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Boards",
        require: true
    },
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
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cards"
    }]
});

//plugins
ListSchema.plugin(lockRelease, 'Lists');

//pre 
ListSchema.pre('save', { document: true }, async function () {
    this.last_edited = Date.now();
});

// Post
ListSchema.post('save', { document: true }, async function () {
    mediator.emit('UpdateBoardLastEdited', this.board);
})

//Compiled model
var ListModel = mongoose.model('Lists', ListSchema);
module.exports = ListModel;
