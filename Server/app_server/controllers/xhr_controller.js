const tm = require('../components/task_manager');
const sm = require('../components/session_manager');
const pako = require('pako');

taskManager = tm.GetTaskManager();
// taskManager.FillCache();
// db.clearLog();

// Display Screen with embedded code
const piScreen = function(req, res, next){
    
    res.render('pi', { title: 'PI' });
};

// Request for server generated session ID
const getSessionID = function(req, res, next)
{
    let id = sm.GenerateSessionID();
    res.send({ sid: id, taskRequestAmount: taskManager.getClientTaskSendAmount(), taskRefillAmount: taskManager.getClientRequestRefillAmount() });
};

// Get Request for JSON data
const taskGet = function(req, res, next)
{

    tasks = taskManager.GetNextTask(req.query.sid, req.query.taskCount);
    res.send(tasks);

    // if(task.status === 'terminate') taskManager.FillCache();
};

// Post Request for JSON data
const taskPost = function(req, res, next)
{

    // let msg = pako.inflate(req.body, {to: 'string'});
    console.log(typeof(req.body.data));
    console.log(req.body);

    // Parse into task container
    // let task = JSON.parse(pako.inflate(atob(req.body.data), {to: 'string'}));
    var b = new Buffer(req.body.data, 'base64')
    var s = b.toString('binary');
    
    let task = JSON.parse(pako.inflate(s, {to: 'string'}));

    taskManager.HandleClientResponse(task);
    
    res.send();

};

module.exports = {
    piScreen,
    taskGet,
    taskPost,
    getSessionID
};