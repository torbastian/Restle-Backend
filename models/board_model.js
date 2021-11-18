const mongoose = require("mongoose");
const List = require("../models/list_model");
const Card = require("../models/card_model");
const Lock = require("../helpers/lock_model");
const lockRelease = require('mongoose-lock-release');
const mediator = require('../helpers/mediator');

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

//plugins
BoardSchema.plugin(lockRelease, 'Boards');

//Pre

BoardSchema.pre('save', { document: true }, async function () {
    this.last_edited = Date.now();
});

//Compiled model

const BoardModel = mongoose.model('Boards', BoardSchema);
module.exports = BoardModel;