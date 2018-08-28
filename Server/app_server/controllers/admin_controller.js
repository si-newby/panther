"use strict";

const taskManager = require('../components/task_manager');
const scriptController = require('../controllers/script_controller');
const db = require('../components/pantherdb');
const os = require('os-utils');

const tm = taskManager.GetTaskManager();

const getAdminScreen = function(req, res, next){
    res.render('adminNew.pug', { title: "Panther Admin", tm: tm, taskScript: scriptController.getCurrentScript(), mem: 100 - Math.round(os.freememPercentage() * 100) });
};

const postAdminScreen = function(req, res, next){
    
    let msg = new Array();

    // Change of tag
    if(tm.getTag() != req.body.job_tag)
    {
        tm.setTag(req.body.job_tag);
        msg.push("Tag updated to '" + tm.getTag() + "'...");
    };

    // Clear DB Log
    if(req.body.clearLog_checkbox)
    {
        db.clearLog();
        msg.push("Log Cleared...");        
    };

    // TaskScript 
    if(scriptController.getCurrentScript() != req.body.task_script)
    {
        scriptController.setCurrentScript(req.body.task_script)
        msg.push("Client JavaScript set to " + scriptController.getCurrentScript() + "...");        
    };

    // Change of task URLs - will clear task cache if change
    if(tm.getGetTaskURL() != req.body.get_task_url || tm.getPostTaskURL() != req.body.post_task_url)
    {
        tm.setTaskURLs(req.body.get_task_url, req.body.post_task_url);
        msg.push("New Task URL(s) Set... Clearing cache...");
    };

    // Set Task Cache Size
    if(tm.getTaskCacheSize() != req.body.cache_size)
    {
        msg.push("Task Cache Size set to " + req.body.cache_size + "...");
        tm.setTaskCacheSize(req.body.cache_size);
    };

    // Clear Task Cache
    if(req.body.clear_checkbox)
    {
        tm.ClearTaskCache();
        msg.push("Task Cache Cleared...");
    }
    // Refill Task Cache - only do it if no request to clear cache has been made
    else if(req.body.refill_checkbox)
    {
        let tasks = tm.FillCache();
        if(tasks == 0) msg.push("No further tasks required to fill cache... \n");
        else msg.push("Filling Task Cache with " + tasks + " tasks...");
    };

    // Set Amount of Tasks Sent to Client
    if(tm.getClientTaskSendAmount() != req.body.task_send_amount)
    {
        msg.push(req.body.task_send_amount + " tasks will be sent to clients each task request...");
        tm.setClientTaskSendAmount(parseInt(req.body.task_send_amount));
    };

    // Set Threshold when client will request more tasks
    if(tm.getClientRequestRefillAmount() != req.body.task_refill_amount)
    {
        msg.push("Client will request tasks when " + req.body.task_refill_amount + " remain in local buffer...");
        tm.setClientRequestRefillAmount(parseInt(req.body.task_refill_amount));
    };
    
    console.log(msg);
    res.render('admin.pug', { title: "Panther Admin", tm: tm, taskScript: scriptController.getCurrentScript(), response: msg, mem: 100 - Math.round(os.freememPercentage() * 100) });

};

const getStatus = function(req, res, next){

    let request = req.query.type;

    if(request == 'tasks')
    {   
        res.send({ percent: tm.getCachePercent(), value: tm.getRemainingTasks() }); 
    }
    else if(request == 'memory')
    {
        let mem = 100 - Math.round(os.freememPercentage() * 100);
        res.send( { percent: mem, value: mem + "%"} ); 
    }
    else res.send();
};

module.exports = {
    getAdminScreen,
    postAdminScreen,
    getStatus
};