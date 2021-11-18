const Board = require("../models/board_model");
const List = require("../models/list_model");
const User = require("../models/user_model");
const Card = require("../models/card_model");
const ListHandler = require("../helpers/list_handler");
const Lock = require("./lock_model");
const { encrypt, decrypt } = require('../helpers/crypt');
const mediator = require('./mediator');
const { OwnerAdminValidator, AdminValidator } = require("./Permission_validator");
const { findOne } = require("../models/user_model");

mediator.on('UpdateBoardLastEdited', async function (boardId) {
    await Board.findOneAndUpdate({ _id: boardId }, { last_edited: Date.now() });
});

async function GetAdminBoardOverview(userId, query, callback) {

    const valid = AdminValidator(userId);
    if (!valid) {
        callback({
            success: false,
            message: 'Bruger er ikke admin'
        })
        return;
    }

    console.log('QUERY', query);

    var page = 1;
    var limit = 10;
    var sort = 'last_edited';
    var order = -1;

    if (query?.page != undefined) {
        page = query.page;
    }

    if (query?.limit != undefined) {
        limit = query.limit;
    }

    if (query?.sort != undefined) {
        sort = query.sort;
    }

    if (query?.order != undefined) {
        order = query.order;
    }

    //Term er om der bliver søgt på title, ejer, eller medlem
    //Search er hvad selve søgningen inkludere
    const validSearch = query?.term && query?.search && query?.term != '' && query?.search != '';
    const regex = new RegExp('.*' + query.search + '.*', 'i');
    let filteredBoards = [];

    try {
        var boards = null;
        var count = null;

        if (validSearch) {
            switch (query.term) {
                case 'owner':
                    boards = await Board.find()
                        .sort({ [sort]: order })
                        .populate({
                            path: 'members',
                            select: 'username create_date first_name last_name colour email'
                        })
                        .populate({
                            path: 'owner',
                            select: 'username create_date first_name last_name colour email'
                        })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .exec();

                    boards.forEach(board => {
                        if (!board.owner) return;

                        if (board.owner.first_name.match(regex)) {
                            filteredBoards.push(board);
                            return;
                        }

                        if (board.owner.email.match(regex)) {
                            filteredBoards.push(board);
                            return;
                        }
                    });

                    boards = filteredBoards;
                    break;
                case 'member':
                    boards = await Board.find()
                        .sort({ [sort]: order })
                        .populate({
                            path: 'members',
                            select: 'username create_date first_name last_name colour email'
                        })
                        .populate({
                            path: 'owner',
                            select: 'username create_date first_name last_name colour email'
                        })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .exec();

                    boards.forEach(board => {
                        console.log(board);
                        if (!board.members) return;

                        for (let i = 0; i < board.members.length; i++) {
                            const member = board.members[i];
                            if (member.first_name.match(regex)) {
                                filteredBoards.push(board);
                                break;
                            }

                            if (member.email.match(regex)) {
                                filteredBoards.push(board);
                                break;
                            }
                        }
                    });

                    boards = filteredBoards;

                    break;
                case 'title':
                    boards = await Board.find({ $or: [{ title: { $regex: '.*' + query.search + '.*', $options: 'i' } }] })
                        .sort({ [sort]: order })
                        .populate({
                            path: 'members',
                            select: 'username create_date first_name last_name colour email',
                        })
                        .populate({
                            path: 'owner',
                            select: 'username create_date first_name last_name colour email'
                        })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .exec();
                    break;
                default:
                    break;
            }

            if (boards != undefined) {
                count = boards.length;
            } else {
                count = 0;
            }

        } else {
            boards = await Board.find()
                .sort({ [sort]: order })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate({
                    path: 'members',
                    select: 'username create_date first_name last_name colour email'
                })
                .populate({
                    path: 'owner',
                    select: 'username create_date first_name last_name colour email'
                })
                .exec();

            count = await Board.countDocuments();
        }


        boards.forEach(board => {
            board.title = decrypt(board.title);
            board.description = decrypt(board.description);
        });

        callback({
            success: true,
            message: 'Board fundet',
            object: {
                boards: boards,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            }
        })

    } catch (err) {
        console.log(err);
        callback({
            success: false,
            message: 'Noget gik galdt da vi forsøgte at finde boards. ' + err
        })
    }
}

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

        board.title = decrypt(board.title);
        board.description = decrypt(board.description);
        console.log("TEST GetBoardList");

        if (!board) {
            return {
                success: false,
                message: 'Intet board fundet'
            }
        } else {
            return {
                success: true,
                message: 'Board Fundet',
                object: board
            }
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

async function CreateBoard(user_id, title, owner, description, callback) {
    if (title.length > 40) {
        callback({
            success: false,
            message: "title er for lang, max 40 charatere"
        });
    }
    if (description.length > 1024) {
        callback({
            success: false,
            message: "description er for lang, max 1024 charatere"
        });
    }

    const newBoard = new Board({
        create_date: Date.now(),
        last_edited: Date.now(),
        title: title,
        owner: owner,
        members: [],
        lists: [],
        description: encrypt(description)
    });

    try {
        await newBoard.save();
        callback({
            success: true,
            message: "Board blev gemt.",
            object: newBoard
        });
    } catch (err) {
        callback({
            success: false,
            message: "board blev ikke gemt. " + err
        });
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
                lists = await List.find({
                    board: board._id
                });
                if (lists) {
                    lists.forEach(list => {
                        Lock.LockModel(list, function () {
                            list.deleteOne();
                        },
                            function (err, result) {

                            })
                    })
                }
                cards = await Card.find({ board: board._id });
                if (cards) {
                    cards.forEach(card => {
                        Lock.LockModel(card, function () {
                            card.deleteOne();
                        },
                            function (err, result) {

                            })
                    });
                }
                board.deleteOne();
                return true;
            },
            function (err, result) {
                if (err) {
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
                board.title = encrypt(title);
                board.description = encrypt(description);
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

        const board = await Board.findOne({ _id: board_id });
        Lock.LockModel(board,
            async function () {
                if (board.members.includes(member_id)) {

                    const cards = await Card.find({ $and: [{ board: board._id }, { members: user_id }] });

                    for (let i = 0; i < cards.length; i++) {
                        const card = cards[i];

                        Lock.LockModel(card,
                            () => {
                                const userIndex = card.members.findIndex(u => u._id.toString() === user_id);
                                card.members.splice(userIndex, 1);
                                card.save();
                            }, (err, result) => {
                                console.log('Fejl ved fjernelsen af medlem i kort' + err);
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

async function RemoveMembers(user_id, board_id, member_id, callback) {
    try {
        const valid = await OwnerAdminValidator(user_id, board_id);
        if (!valid) {
            callback({
                success: false,
                message: "kun board ejer og admins kan fjerne board medlemmer"
            });
            return;
        }

        if (!Array.isArray(member_id)) {
            callback({
                success: false,
                message: "member_id is not an array"
            })
            return;
        }

        const board = await Board.findOne({ _id: board_id });
        // const lists = await List.find({
        //     board: board._id
        // });
        console.log('!!! Members', member_id);
        const cards = await Card.find({ $and: [{ board: board._id }, { members: { $in: member_id } }] });
        console.log('BOARD ID', board_id);

        console.log('!!! Cards ', cards);
        Lock.LockModel(board,
            function () {
                for (let i = 0; i < cards.length; i++) {
                    for (let x = 0; x < member_id.length; x++) {
                        const index = cards[i].members.indexOf(member_id[x]);
                        if (index >= 0) {
                            cards[i].members.splice(index, 1);
                        }
                    }
                    Lock.LockModel(cards[i],
                        function () {
                            console.log('Lock cards');
                            cards[i].save();
                        },
                        function (err, result) {

                        });
                }
            },
            function (err, result) {
                if (err) {
                    callback(err);
                    return
                }
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

        const user = await User.findOne({ _id: new_owner_id });

        if (!user) {
            callback({
                success: false,
                message: 'Bruger kunne ikke findes'
            });
        }

        const board = await Board.findOne({ _id: board_id });

        if (!board) {
            callback({
                success: false,
                message: 'Board kunne ikke findes'
            });
        }

        result = Lock.LockModel(board,
            function () {
                const userIndex = board.members.findIndex(u => u._id.toString() == user_id);

                if (userIndex == -1) {
                    callback({
                        success: false,
                        message: 'Bruger kunne ikke findes på board'
                    })
                }

                const previousOwner = board.owner;
                board.owner = owner_id;

                board.members.splice(userIndex, 1);
                board.members.push(previousOwner);
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
                if (err) {
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
                            if (err) {
                                callback(err);
                                return;
                            }
                            if (board) {
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
exports.GetAdminBoardOverview = GetAdminBoardOverview;
exports.RemoveMembers = RemoveMembers;
