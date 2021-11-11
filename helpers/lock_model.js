function LockModel(ModelToLock, Action, Callback) {
    ModelToLock.lock(2000, async function (err, model) {
        console.log("LOCK MODEL ERROR: " + err);
        console.log("LOCK MODEL MODEL: " + model);
        if (!model) {
            return;
        }
        await Action();
    });
    ModelToLock.release(function (err, model) {
        if (ModelToLock) {
            Callback(undefined, model);
        } else {
            Callback(err, undefined);
        }
    });
}

exports.LockModel = LockModel;