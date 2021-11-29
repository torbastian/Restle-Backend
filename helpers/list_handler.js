const Card = require("../models/card_model");
const CardHandler = require("../helpers/card_handler");
const List = require("../models/list_model");
const Board = require('../models/board_model');
const Lock = require('../helpers/lock_model');
const { encrypt } = require('./crypt');
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
    } catch (err) {
        return {
            success: false,
            message: "Kunne ikke hente lister. " + err
        }
    }
}

async function CreateList(user_id, board_id, title, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
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
        title: encrypt(title),
        cards: [],
        created_date: Date.now(),
        last_edited: Date.now(),
    });

    try {

        board = await Board.findOne({ _id: board_id });
        result = Lock.LockModel(board,
            async function () {
                if (!board.lists.includes(newList._id)) {
                    board.lists.push(newList._id);
                    await newList.save();
                    await board.save();
                    callback({
                        success: true,
                        message: "Liste blev oprettet",
                        object: newList
                    });
                    return true;
                } else {
                    callback({
                        success: false,
                        message: "Liste id findes allerede på boardet"
                    });
                    return;
                }
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
            });

        callback({
            success: true,
            message: 'Liste blev oprettet'
        });
    } catch (err) {
        callback({
            success: false,
            message: "liste blev ikke gemt. " + err
        });
    }
}

async function DeleteList(user_id, board_id, list_id, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan slette lister"
        });
        return;
    }
    try {
        list = await List.findOne({ _id: list_id });
        board = await Board.findOne({ _id: board_id });
        await Lock.LockModel(list,
            function () {
                Lock.LockModel(board,
                    async function () {

                        cards = await Card.find({ list: list._id });

                        cards.forEach(element => {
                            Lock.LockModel(element, function () {
                                element.deleteOne();
                            },
                                function (err, result) {

                                })
                        });

                        const index = board.lists.indexOf(list._id);
                        board.lists.splice(index, 1);
                        await board.save();
                        await list.deleteOne();
                        callback({
                            success: true,
                            message: "Liste er blevet slettet",
                            object: list
                        });
                        return true;
                    },
                    function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                    })
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
            });
    } catch (err) {
        return {
            success: false,
            message: "liste blev ikke slettet. " + err
        }
    }
}

async function EditList(user_id, board_id, list_id, title, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan redigere liste title"
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

    try {
        list = await List.findOne({ _id: list_id });
        Lock.LockModel(list,
            async function () {
                list.title = title;
                await list.save();
                callback({
                    success: true,
                    message: "Liste title er blivet ændret til " + title,
                    object: list
                });
                return true;
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "liste title blev ikke ændret. " + err
        });
    }
}

async function AddCard(user_id, board_id, list_id, card_id, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan tilføje kort til listen"
        });
        return;
    }
    try {
        list = await List.findOne({ _id: list_id });
        card = await Card.findOne({ _id: card_id })
        Lock.LockModel(list,
            function () {
                Lock.LockModel(card,
                    async function () {
                        if (!list.cards.includes(card_id)) {
                            list.cards.push(card_id);
                            card.list = list_id;
                            await list.save();
                            await card.save();
                            callback({
                                success: true,
                                message: "Kort " + card.title + " er blevet tilføjet til listen",
                                object: list
                            });
                            return true;
                        }
                    },
                    function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (list && card) {
                        }
                    });
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "Kort blev ikke tilføjet til liste. " + err
        });
    }
}

async function RemoveCard(user_id, board_id, list_id, card_id, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try {
        list = await List.findOne({ _id: list_id });
        card = await Card.findOne({ _id: card_id })
        Lock.LockModel(list,
            function () {
                Lock.LockModel(card,
                    function () {
                        if (list.cards.includes(card_id)) {
                            const index = list.cards.indexOf(card_id);
                            list.cards.splice(index, 1);
                            card.list = undefined;
                            list.save();
                            card.save();
                            return true;
                        }
                    },
                    function (err, result) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (list && card) {
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
                if (err) {
                    callback(err);
                    return;
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "Kort blev ikke fjernet fra listen. " + err
        });
    }
}

async function MoveList(user_id, board_id, list_id, new_index, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: 'Kun admins eller board ejer kan rykke rundt på lister'
        });
        return;
    }

    try {
        const board = await Board.findOne({ _id: board_id });

        if (!board) {
            callback({
                success: false,
                message: 'Board kunne ikke findes'
            });
            return;
        }

        Lock.LockModel(board,
            async () => {
                let newLists = [...board.lists];
                let oldIndex = newLists.findIndex(l => l._id.toString() == list_id.toString());

                if (oldIndex == -1) {
                    callback({
                        success: false,
                        message: 'Listen kunne ikke findes'
                    })
                    return;
                }

                if (oldIndex == new_index) {
                    callback({
                        success: false,
                        message: 'Liste er er allerde på ny index'
                    });
                    return;
                }

                let removedList = newLists.splice(oldIndex, 1)[0];
                newLists.splice(new_index, 0, removedList);

                board.lists = newLists;
                await board.save();

                callback({
                    success: true,
                    message: 'Liste blev rykket'
                });

                return true;
            }, (err, result) => {
                if (err) {
                    callback(err);
                    return;
                }
            }
        );

    } catch (err) {
        callback({
            success: false,
            message: 'Liste blev ikke rykket. ' + err
        });
    }
}

exports.CreateList = CreateList;
exports.DeleteList = DeleteList;
exports.EditList = EditList;
exports.AddCard = AddCard;
exports.RemoveCard = RemoveCard;
exports.GetLists = GetLists;
exports.MoveList = MoveList;