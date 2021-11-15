function LockModel(ModelToLock, Action, Callback) {
    ModelToLock.lock(2000, async function (err, model) {
        if (!model) {
            Callback({
                success: false,
                status: "DB",
                message: "Model er låst. prøv igen sener"
            }, null);
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