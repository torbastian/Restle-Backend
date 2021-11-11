const Card = require("../models/card_model");
const List = require("../models/list_model");
const Board = require('../models/board_model');
const Lock = require('../helpers/lock_model');
const { OwnerAdminValidator } = require("./Permission_validator");

async function GetLists(board_id) {
    try {
        return List.find({ board: board_id }).then(lists => {
            return {
                success: true,
                message: "boardeds lister blev fundet",
                object: lists
            }
        }).catch(err => {
            return {
                success: false,
                message: "Kunne ikke hente lister. " + err
            }
        });
    }catch(err){
        return {
            success: false,
            message: "Kunne ikke hente lister. " + err
        }
    }
}

async function CreateList(user_id, board_id, title, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan tilføje lister"
        });
        return;
    }
    if (title.length > 40) {
        callback({
            success: false,
            message: "title er for lang, max 40 charatere"
        });
        return;
    }

    const newList = new List({
        board: board_id,
        title: title,
        cards: [],
        created_date: Date.now(),
        last_edited: Date.now(),
    });

    try {
        
        board = await Board.findOne({ _id: board_id });
        result = Lock.LockModel(board,
            function () {
                if (!board.lists.includes(newList._id)) {
                    board.lists.push(newList._id);
                    newList.save();
                    board.save();
                    return true;
                }else{
                    callback({
                        success: false,
                        message: "Liste id findes allerede på boardet"
                    });
                    return;
                }
            },
            function(err, result){
                if(err){
                    callback(err);
                    return;
                }
                if(newList && board){
                    callback({
                        success: true,
                        message: "Liste blev oprettet",
                        object: newList
                    });
                }
            });
    }catch(err){
        callback({
            success: false,
            message: "liste blev ikke gemt. " + err
        });
    }
}

async function DeleteList(user_id, board_id, list_id, callback) {
    if(!OwnerAdminValidator(user_id, board_id)){
        callback({
            success: false,
            message: "kun admins eller board ejer kan slette lister"
        });
        return;
    }
    try{
        list = await List.findOne({ _id: list_id });
        board = await Board.findOne({_id: board_id});
        Lock.LockModel(list,
            function(){
                Lock.LockModel(board,
                function(){
                    const index = board.lists.indexOf(list._id);
                    board.lists.splice(index, 1);
                    board.save();
                    list.deleteOne();
                    return true;
                },
                function(err, result){
                    if(err){
                        callback(err);
                        return;
                    }
                    if(list && board){
                        callback({
                            success: true,
                            message: "Liste er blevet slettet",
                            object: list
                        });
                        return;
                    }
                })
            },
            function(err, result){
                if(err){
                    callback(err);
                    return;
                }
                if(list){
                    callback({
                        success: true,
                        message: "Liste blev slettet",
                        object: list
                    });
                }
            });
    }catch(err){
        return {
            success: false,
            message: "liste blev ikke slettet. " + err
        }
    }
}

async function EditTitle(user_id, board_id, list_id, title, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan redigere liste title"
        });
        return;
    }
    if(title.length > 40){
        callback({
            success: false,
            message: "title er for lang, max 40 charatere"
        });
        return;
    }
    try{
        list = await List.findOne({ _id: list_id });
        Lock.LockModel(list,
        function () {
            list.title = title;
            list.save();
            return true;
        },
        function(err, result){
            if(err){
                callback(err);
                return;
            }
            if(list){
                callback({
                    success: true,
                    message: "Liste title er blivet ændret til " + title,
                    object: list
                });
            }
        });
    }catch(err){
        callback({
            success: false,
            message: "liste title blev ikke ændret. " + err
        });
    }
}

async function AddCard(user_id, board_id, list_id, card_id, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan tilføje kort til listen"
        });
        return;
    }
    try {
        list = await List.findOne({ _id: list_id });
        card = await Card.findOne({_id: card_id})
        Lock.LockModel(list,
            function () {
                Lock.LockModel(card,
                function(){
                    if(!list.cards.includes(card_id)){
                        list.cards.push(card_id);
                        card.list = list_id;
                        list.save();
                        card.save();
                        return true;
                    }
                },
                function(err, result){
                    if(err){
                        callback(err);
                        return;
                    }
                    if(list && card){
                        callback({
                            success: true,
                            message: "Kort " + card.title + " er blevet tilføjet til listen",
                            object: list
                        });
                        return;
                    }
                });
            },
            function (err, result) {
                if(err){
                    callback(err);
                    return;
                }
            });
    }catch(err){
        callback({
            success: false,
            message: "Kort blev ikke tilføjet til liste. " + err
        });
    }
}

async function RemoveCard(user_id, board_id, list_id, card_id, callback) {
    if (!OwnerAdminValidator(user_id, board_id)) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try {
        list = await List.findOne({ _id: list_id });
        card = await Card.findOne({_id: card_id})
        Lock.LockModel(list,
            function () {
                Lock.LockModel(card,
                function(){
                    if(list.cards.includes(card_id)){
                        const index = list.cards.indexOf(card_id);
                        list.cards.splice(index, 1);
                        card.list = undefined;
                        list.save();
                        card.save();
                        return true;
                    }
                },
                function(err, result){
                    if(err){
                        callback(err);
                        return;
                    }
                    if(list && card){
                        callback({
                            success: true,
                            message: "Kort " + card.title + " er blevet fjernet fra listen",
                            object: list
                        });
                        return;
                    }
                });
            },
            function (err, result) {
                if(err){
                    callback(err);
                    return;
                }
            });
    }catch(err){
        callback({
            success: false,
            message: "Kort blev ikke fjernet fra listen. " + err
        });
    }
}

exports.CreateList = CreateList;
exports.DeleteList = DeleteList;
exports.EditTitle = EditTitle;
exports.AddCard = AddCard;
exports.RemoveCard = RemoveCard;
exports.GetLists = GetLists;