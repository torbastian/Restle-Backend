function LockModel(ModelToLock, Action, Callback){
    ModelToLock.lock(2000, async function(err, model){
        if(!model){
            return;
        }
        Action();
    });
    list.release(function(err, model){
        if(list){
            Callback(undefined, model);
        }else{
            Callback(err, undefined);
        }
    });
}

exports.LockModel = LockModel;