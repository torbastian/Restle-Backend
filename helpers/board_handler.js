const Board = require("../models/board_model");
const List = require("../models/list_model");
const User = require("../models/user_model");
const ListHandler = require("../helpers/list_handler");
const Lock = require("./lock_model");
const mediator = require('./mediator');
const { OwnerAdminValidator } = require("./Permission_validator");

mediator.on('UpdateBoardLastEdited', async function (boardId) {
    console.log('UpdateBoardLastEdited');
    await Board.findOneAndUpdate({ _id: boardId }, { last_edited: Date.now() });
});

async function GetBoardListAsOwner(board_owner) {
    try {
        return await Board.find({ owner: board_owner })
            .sort({ 'last_edited': -1 })
            .populate({
                path: 'owner',
                select: 'username create_date first_name last_name colour'
            })
            .populate({
                path: 'members',
                select: 'username create_date first_name last_name colour'
            })
            .select('-lists').then(boards => {
                return {
                    success: true,
                    message: "vi fandt " + boards.length + " som du er ejer af",
                    object: boards
                }
            }).catch(err => {
                return {
                    success: false,
                    message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
                }
            });
    } catch (err) {
        return {
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function GetBoardListAsMember(member_id) {
    try {
        return await Board.find({ members: member_id })
            .sort({ 'last_edited': -1 })
            .populate({
                path: 'owner',
                select: 'username create_date first_name last_name colour'
            })
            .populate({
                path: 'members',
                select: 'username create_date first_name last_name colour'
            })
            .select('-lists').then(boards => {
                return {
                    success: true,
                    message: "vi fandt " + boards.length + " som du er medlem af",
                    object: boards
                }
            });
    } catch (err) {
        return {
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function GetBoardList(boardId) {
    try {
        const board = await Board.findById(boardId)
            .populate({
                path: 'owner',
                select: 'username create_date first_name last_name colour'
            })
            .populate({
                path: 'members',
                select: 'username create_date first_name last_name colour'
            })
            .select('-lists');

        return {
            sucess: true,
            message: 'Board Fundet',
            object: board
        }

    } catch (err) {
        return {
            sucess: false,
            message: 'Noget gik galt da vi forsøgte at finde boardet. ' + err
        }
    }
}

async function GetBoard(boardId) {
    try {
        const board = await Board.findById(boardId)
            .populate({
                path: 'owner',
                select: 'username create_date first_name last_name colour'
            })
            .populate({
                path: 'members',
                select: 'username create_date first_name last_name colour'
            })
            .populate({
                path: 'lists',
                model: 'Lists',
                populate: {
                    path: 'cards',
                    model: 'Cards',
                    populate: {
                        path: 'members',
                        select: 'username create_date first_name last_name colour'
                    }
                }
            });

        if (!board) {
            return {
                success: false,
                message: 'Board blev ikke fundet'
            }
        } else {
            return {
                success: true,
                message: 'Board fundet',
                object: board
            }
        }

    } catch (error) {
        return {
            success: false,
            message: 'Noget gik galt da vi forsøgte at finde boardet'
        }
    }
}

async function CreateBoard(user_id, title, owner, description = "") {
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

    const newBoard = new Board({
        create_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        owner: owner,
        members: [],
        lists: [],
        description: description
    });

    try {
        newBoard.save();
        return {
            success: true,
            message: "Board blev gemt.",
            object: newBoard
        }
    } catch (err) {
        return {
            success: false,
            message: "board blev ikke gemt. " + err
        };
    }
}

async function DeleteBoard(board_id, user_id, callback) {
    try {
        const valid = await OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan slette boardet"
            });
        }

        board = await Board.findOne({ _id: board_id });
        Lock.LockModel(board,
            async function () {
                lists = List.find({
                    board: board._id
                });
                lists.array.forEach(element => {
                    Lock.LockModel(element, function(){
                        ListHandler.DeleteList(element._id);
                        return true;
                    },
                    function(err, result){
                        if(err){
                            callback(err);
                        }
                    });
                });
                board.deleteOne();
                return true;
            },
            function (err, result) {
                if(err){
                    callback(err);
                    return;
                }
                if (board) {
                    callback({
                        success: true,
                        message: "Board " + board.title + " blev slettet ",
                        object: board
                    });
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "board blev ikke slettet. " + err
        });
    }
}

async function EditBoard(user_id, board_id, title, description, callback) {
    try {
        const valid = await OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan redigere board"
            });
        }

        board = await Board.findOne({ _id: board_id });
        Lock.LockModel(board,
            function () {
                board.title = title;
                board.description = description;
                board.save();
                return true;
            },
            function (err, result) {
                if (board) {
                    callback({
                        success: true,
                        message: "Board title blev ændret til " + board.title,
                        object: board
                    })
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "board blev ikke updated " + err
        });
    }
}

async function AddMember(user_id, board_id, member_id, callback) {
    try {
        const valid = await OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan tilføje board medlemmer"
            });
        }

        board = await Board.findOne({ _id: board_id });
        Lock.LockModel(board,
            function () {
                if (!board.members.includes(member_id)) {
                    board.members.push(member_id);
                    board.save();
                    return true;
                }
            },
            function (err, result) {
                if (board) {
                    callback({
                        success: true,
                        message: "Board medlem blev tilføjet",
                        object: board
                    })
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "bruger blev ikke medlem. " + err
        });
    }
}

async function RemoveMember(user_id, board_id, member_id, callback) {
    try {
        const valid = await OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan fjerne board medlemmer"
            });
        }

        board = await Board.findOne({ _id: board_id });
            Lock.LockModel(board,
            function () {
                if (board.members.includes(member_id)) {
                    lists = List.find({
                        board: board._id
                    });

                    if(lists){
                        lists.forEach(element => {
                            ListHandler.DeleteList(element._id);
                        });
                    }

                    const index = board.members.indexOf(member_id);
                    board.members.splice(index, 1);
                    board.save();
                    return true;
                }
            },
            function (err, result) {
                if (board) {
                    callback({
                        success: true,
                        message: "Board medlem blev fjernet",
                        object: board
                    })
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "medlem blev ikke fjernet. " + err
        });
    }
}

async function ChangeOwner(user_id, board_id, owner_id, callback) {
    try {
        const valid = !OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan ændre board ejer"
            });
        }

        board = await Board.findOne({ _id: board_id });
        result = Lock.LockModel(board,
            function () {
                board.owner = owner_id;
                board.save();
                return true;
            },
            function (err, result) {
                if (board) {
                    callback({
                        success: true,
                        message: board.owner + " er den nye ejer af boardet",
                        object: board
                    })
                }
            }
        );
        if (result) {
            callback(result);
        } else {
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    } catch (err) {
        callback({
            success: false,
            message: "Ejerskab blev ikke overført. " + err
        });
    }
}

async function AddBoardList(user_id, board_id, list_id, callback) {
    try {
        const valid = !OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan tilføje liste til board"
            });
        }

        board = await Board.findOne({ _id: board_id });
        list = await List.findOne({ _id: list_id });
        Lock.LockModel(board,
            function () {
                if (!board.lists.includes(list_id)) {
                    board.lists.push(list_id);
                    board.save();
                    return true;
                }
            },
            function (err, result) {
                if(err){
                    callback(err);
                }
                if (list) {
                    result2 = Lock.LockModel(list,
                        function () {
                            list.board = board_id;
                            list.save();
                            return true;

                        },
                        function (err, result2) {
                            if(err){
                                callback(err);
                                return;
                            }
                            if(board){
                                callback({
                                    success: true,
                                    message: "Liste er blevet tilføjet til boardet.",
                                    object: board
                                });
                            }
                        }
                    );
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "Noget gik galt da vi forsøgte at tilføje listen. " + err
        });
    }
}

async function RemoveList(user_id, board_id, list_id, callback) {
    try {
        const valid = !OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan fjerne liste fra board"
            });
            return;
        }

        board = await Board.findOne({ _id: board_id });
        list = await List.findOne({ _id: list_id });
        Lock.LockModel(board,
            function () {
                if (board.lists.includes(list_id)) {
                    const index = board.lists.indexOf(list_id);
                    board.lists.splice(index, 1);
                    board.save();
                    return true;
                }
            },
            function (err, result) {
                if (list) {
                    result2 = Lock.LockModel(list,
                        function () {
                            list.board = undefined;
                            list.save();
                            return true;

                        },
                        function (err, result2) {
                            if (board) {
                                callback({
                                    success: true,
                                    message: "Liste er blevet fjernet fra boardet",
                                    object: board
                                });
                            }
                        });
                }
            }
        );
    } catch (err) {
        callback({
            success: false,
            message: "noget gik galt da vi forsøgte at fjerne listen. " + err
        });
    }
}

exports.CreateBoard = CreateBoard;
exports.DeleteBoard = DeleteBoard;
exports.EditBoard = EditBoard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.ChangeOwner = ChangeOwner;
exports.GetBoardListAsMember = GetBoardListAsMember;
exports.GetBoardListAsOwner = GetBoardListAsOwner;
exports.AddBoardList = AddBoardList;
exports.RemoveList = RemoveList;
exports.GetBoard = GetBoard;
exports.GetBoardList = GetBoardList;
