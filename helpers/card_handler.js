const Card = require("../models/card_model");
const List = require("../models/list_model");
const Lock = require("./lock_model");
const Board = require('../models/board_model');
const User = require('../models/user_model');
const { encrypt } = require('./crypt');
const { OwnerAdminValidator, MemberValidator } = require("./Permission_validator");

async function GetCards(board_id) {
    try {
        return Card.find({ board: board_id }).then(cards => {
            return {
                success: true,
                message: "Boardes kort blev fundet",
                object: cards
            }
        }).catch(err => {
            return {
                success: false,
                message: "Boardets kort blev ikke fundet. " + err
            }
        });
    } catch (err) {
        return {
            success: false,
            message: "Boardets kort blev ikke fundet. " + err
        }
    }
}

async function CreateCard(user_id, board_id, list_id, title, description, callback) {
    const valid = await MemberValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    if (title.length > 40) {
        return {
            success: false,
            message: "title er for lang, max 40 charatere"
        }
    }
    if (description.length > 1024) {
        return {
            success: false,
            message: "description er for lang, max 1024 charatere"
        }
    }

    const newCard = await new Card({
        board: board_id,
        list: list_id,
        created_date: Date.now(),
        last_edited: Date.now(),
        title: encrypt(title),
        description: encrypt(description),
        members: []
    });

    try {
        list = await List.findOne({ _id: list_id })
        Lock.LockModel(list,
            async function () {
                if (list) {
                    await list.cards.push(newCard._id);
                    await list.save();
                    await newCard.save();
                    return true;
                } else {
                    return false;
                }
            },
            function (err, result) {
                if (err) {
                    callback(err);
                }
                if (newCard) {
                    callback({
                        success: true,
                        message: "Kort er blevet gemt",
                        object: newCard
                    });
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "Kort blev ikke gemt. " + err
        });
    }
}

async function DeleteCard(user_id, board_id, card_id, callback) {
    const valid = MemberValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try {
        card = await Card.findOne({ _id: card_id });
        Lock.LockModel(card,
            function () {
                card.deleteOne();
                return true;
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (card) {
                    callback({
                        success: true,
                        message: "Kort er blevet slettet",
                        object: card
                    });
                }
            });
    } catch (err) {
        callback({
            success: false,
            message: "Korted blev ikke slettet. " + err
        });
    }
}

async function EditCard(user_id, board_id, card_id, title, description, callback) {
    const valid = MemberValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan redigere et kort"
        });
        return;
    }
    try {
        card = await Card.findOne({ _id: card_id });
        Lock.LockModel(card,
            function () {
                card.description = description;
                card.title = title;
                card.save();
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (card) {
                    callback({
                        success: true,
                        message: "Kort er blevet gemt",
                        object: card
                    });
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "Kort blev ikke gemt. " + err
        });
    }
}

async function AddMember(user_id, board_id, card_id, member_id, callback) {
    const valid = OwnerAdminValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    card = await Card.findOne({ _id: card_id });
    Lock.LockModel(card,
        function () {
            if (!card.members.includes(member_id)) {
                card.members.push(member_id);
                card.save();
                return true;
            }
        },
        function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            if (result) {
                callback({
                    success: true,
                    message: "Kort er blevet gemt",
                    object: result
                });
            }
        });
}

async function RemoveMember(user_id, board_id, card_id, member_id, callback) {
    const valid = await OwnerAdminValidator(user_id, board_id)
    if (!valid) {
        callback({
            success: false,
            message: "kun admins eller board ejer kan fjerne kort fra listen"
        });
        return;
    }
    try {
        card = await Card.findOne({ _id: card_id });
        result = Lock.LockModel(card,
            function () {
                if (card.members.includes(member_id)) {
                    const index = card.members.indexOf(member_id);
                    card.members.splice(index, 1);
                    card.save();
                    return true;
                }
            },
            function (err, result) {
                if (err) {
                    callback(err);
                }
                if (card) {
                    callback({
                        success: true,
                        message: "Kort medlem er blevet fjernet",
                        object: card
                    });
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "noget gik galt da vi forsøgte at fjerne medlem fra kort. " + err
        });
    }
}

async function MoveCard(user_id, board_id, card_to_move_id, old_list_id, new_list_id, destination_index, callback) {
    const valid = await MemberValidator(user_id, board_id);
    if (!valid) {
        callback({
            success: false,
            message: 'Kun medlemmer af boardet eller admins kan rykke et kort'
        })
        return;
    }

    try {

        const board = await Board.findOne({ _id: board_id });
        const oldList = await List.findOne({ _id: old_list_id });

        if (oldList.board.toString() != board._id.toString()) {
            callback({
                success: false,
                message: 'Listen tilhøre et andet board'
            })
            return;
        }

        let card = oldList.cards.find(c => c._id == card_to_move_id);

        if (!card) {
            callback({
                success: false,
                message: 'Kortet kunne ikke findes på listen'
            })
            return;
        }


        if (old_list_id.toString() == new_list_id.toString()) {
            let _oldListCards = [...oldList.cards];

            const cardIndex = _oldListCards.findIndex(c => c._id == card_to_move_id);
            _oldListCards.splice(cardIndex, 1)
            _oldListCards.splice(destination_index, 0, { _id: card_to_move_id });
            oldList.cards = _oldListCards;

            Lock.LockModel(oldList,
                () => {
                    oldList.save();
                    return true;
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return;
                    }

                    callback({
                        success: true,
                        message: 'Kort rykket',
                        object: oldList
                    });
                    return;
                }
            );
        } else {
            const _card = await Card.findOne({ _id: card_to_move_id });
            const newList = await List.findOne({ _id: new_list_id });

            if (newList.board.toString() != board._id.toString()) {
                callback({
                    success: false,
                    message: 'Den nye liste kunne ikke findes på boardet'
                })
                return;
            }

            let _oldListCards = [...oldList.cards];
            const cardIndex = _oldListCards.findIndex(c => c._id == card_to_move_id);
            _oldListCards.splice(cardIndex, 1);

            _newListCards = [...newList.cards];
            _newListCards.splice(destination_index, 0, { _id: card_to_move_id });

            // oldList.cards.pull({ _id: card_to_move_id });
            // newList.cards.splice(destination_index, 0, { _id: card_to_move_id });
            oldList.cards = _oldListCards;
            newList.cards = _newListCards;

            _card.list = newList._id;

            Lock.LockModel(_card,
                () => {
                    _card.save();
                    return true;
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                }
            );

            Lock.LockModel(oldList,
                () => {
                    oldList.save();
                    return true;
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                }
            );

            Lock.LockModel(newList,
                () => {
                    newList.save();
                    return true;
                }, (err, result) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                }
            );

            callback({
                success: true,
                message: 'Kort Rykket',
                object: [oldList, newList]
            });
            return;
        }
    } catch (err) {
        callback({
            success: false,
            message: 'Noget gik galt da vi forsøgte at rykke kortet' + err
        })
    }
}

exports.CreateCard = CreateCard;
exports.DeleteCard = DeleteCard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.EditCard = EditCard;
exports.GetCards = GetCards;
exports.MoveCard = MoveCard;