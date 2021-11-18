function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  async function sleep(time){
      await delay(time);
  }

exports.sleep = sleep;