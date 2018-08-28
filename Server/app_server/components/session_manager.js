"use strict";

const crypto = require('crypto');
const db = require('../components/pantherdb');
const tm = require('../components/task_manager');

const taskManager = tm.GetTaskManager();

function GenerateSessionID()
{

    let sid = crypto.randomBytes(12).toString('hex');

    db.writeLog(taskManager.getTag(), sid, null, "REQUEST", "SESSION ID", null, null, null, null);

    return sid;

};

module.exports = {
    GenerateSessionID
}