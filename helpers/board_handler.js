const Board = require("../models/board_model");
const List = require("../models/list_model");
const User = require("../models/user_model")

async function GetBoardAsOwner(board_owner){
    try{
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
            return{
                success: false,
                message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
            }
        });
    }catch(err){
        return{
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function GetBoardAsMember(member_id){
    try{
        return await Board.find({ members: member_id })
        .sort({ 'last_edited': -1 })
        .populate({
            path: 'owner',
            select: 'username created first_name last_name colour'
        })
        .populate({
            path: 'members',
            select: 'username created first_name last_name colour'
        })
        .select('-lists').then(boards => {
            return {
                success: true,
                message: "vi fandt " + boards.length + " som du er medlem af",
                object: boards
            }
        });
    }catch(err){
        return{
            success: false,
            message: "noget gik galt da vi forsøgte at hente dine Boards. " + err
        }
    }
}

async function CreateBoard(user_id, title, owner, description){
    if(title.length > 40){
        return{
            success: false,
            message: "title er for lang, max 40 charatere"
        }
    }
    if(description.length > 1024){
        return{
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

    try{
        newBoard.save();
        return{
            success: true,
            message: "Board blev gemt.",
            object: newBoard
        }
    }catch(err){
        return{
            success: false,
            message: "board blev ikke gemt. " + err
        };
    }
}

async function DeleteBoard(board_id, user_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan slette boardet"
            });
        }

        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
            function(){
                board.deleteOne();
                return true;
            },
            function(err, result){
                if(board){
                    callback({
                        success: true,
                        message: "Board title blev slettet ",
                        object: board
                    })
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "board blev ikke slettet. " + err
        });
    }
}

async function EditBoard(user_id, board_id, title, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan redigere board title"
            });
        }

        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
            function(){
                board.title = title;
                board.save();
                return true;
            },
            function(err, result){
                if(board){
                    callback({
                        success: true,
                        message: "Board title blev ændret til " + board.title,
                        object: board
                    })
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "board blev ikke updated"
        });
    }
}

async function AddMember(user_id, board_id, member_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan tilføje board medlemmer"
            });
        }

        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
            function(){
                if(!board.members.includes(member_id)){
                    board.members.push(member_id);
                    board.save();
                    return true;
                }
            },
            function(err, result){
                if(board){
                    callback({
                        success: true,
                        message: "Board medlem blev tilføjet",
                        object: board
                    })
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "bruger blev ikke medlem. " + err
        });
    }
}

async function RemoveMember(user_id, board_id, member_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan fjerne board medlemmer"
            });
        }

        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
            function(){
                if(board.members.includes(member_id)){
                    const index = board.members.indexOf(member_id);
                    board.members.splice(index, 1);
                    board.save();
                    return true;
                }
            },
            function(err, result){
                if(board){
                    callback({
                        success: true,
                        message: "Board medlem blev fjernet",
                        object: board
                    })
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "medlem blev ikke fjernet. " + err
        });
    }
}

async function ChangeOwner(user_id, board_id, owner_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan ændre board ejer"
            });
        }

        board = await Board.findOne({_id: board_id});
        result = Lock.LockModel(board, 
            function(){
                board.owner = owner_id;
                board.save();
                return true;
            },
            function(err, result){
                if(board){
                    callback({
                        success: true,
                        message: board.owner + " er den nye ejer af boardet",
                        object: board
                    })
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "Ejerskab blev ikke overført. " + err
        });
    }
}

async function AddBoardList(user_id, board_id, list_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan tilføje liste til board"
            });
        }

        board = await Board.findOne({_id: board_id});
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(board, 
            function(){
                if(!board.lists.includes(list_id)){
                    board.lists.push(list_id);
                    board.save();
                    return true;
                }
            },
            function(err, result){
                if(list){
                    result2 = Lock.LockModel(list, 
                    function(){
                        list.board = board_id;
                        list.save();
                        return true;
                        
                    },
                    function(err, result2){
                        if(board){
                            callback({
                                success: true,
                                message: "Liste er blevet tilføjet til boardet.",
                                object: board
                            });
                        }                
                    });
                }                
            }
        );
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "Noget gik galt da vi forsøgte at tilføje listen. " + err
        });
    }
}

async function RemoveList(user_id, board_id, list_id, callback){
    try{
        if(!OwnerAdminValidator(user_id, board_id)){
            callback({
                success: false,
                message: "kun board ejer og admins kan fjerne liste fra board"
            });
            return;
        }

        board = await Board.findOne({_id: board_id});
        list = await List.findOne({_id: list_id});
        result = Lock.LockModel(board, 
            function(){
                if(board.lists.includes(list_id)){
                    const index = board.lists.indexOf(list_id);
                    board.lists.splice(index, 1);
                    board.save();
                    return true;
                }
            },
            function(err, result){
                if(list){
                    result2 = Lock.LockModel(list, 
                    function(){
                        list.board = undefined;
                        list.save();
                        return true;
                        
                    },
                    function(err, result2){
                        if(board){
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
        if(result){
            callback(result);
        }else{
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            await sleep(1000);
        }
    }catch(err){
        callback({
            success: false,
            message: "noget gik galt da vi forsøgte at fjerne listen. " + err
        });
    }
}

function OwnerAdminValidator(user_id, board_id){
    try{
        const board = Board.findOne({_id: board_id});
        const user = User.findOne({_id: user_id});
    
        if(user.isAdmin || user_id == board.owner){
            return true;
        }else{
            return false;
        }
    }catch(err){
        throw new Error("user eller admin fejlede");
    }
}

function AdminValidator(user_id){
    try{
        const user = User.findOne({_id: user_id});
    
        if(user.isAdmin){
            return true;
        }else{
            return false;
        }
    }catch(err){
        throw new Error("owner eller admin validator fejlede");
    }
}

exports.CreateBoard = CreateBoard;
exports.DeleteBoard = DeleteBoard;
exports.EditBoard = EditBoard;
exports.AddMember = AddMember;
exports.RemoveMember = RemoveMember;
exports.ChangeOwner = ChangeOwner;
exports.GetBoardAsMember = GetBoardAsMember;
exports.GetBoardAsOwner = GetBoardAsOwner;
exports.AddBoardList = AddBoardList;
exports.RemoveList = RemoveList;