"use strict";

const request = require('request');
const crypto = require('crypto');
const db = require('../components/pantherdb');
const pako = require('pako');

let taskManager = new TaskManager();

function GetTaskManager()
{
    return taskManager;
};

function CreateTaskContainer(taskID, task)
{
    return { 
        tid: taskID,
        sid: "",
        sessionTaskNumber: 0,
        sessionDowntime: 0, 
        status: "unprocessed",
        checkpointNumber: 0,
        timeTaken: 0,
        Task: task };
};

function TaskManager()
{

    console.log("Task Manager Created...");

    let jobTag = "tag";

    let getTaskURL = 'https://generatetask.azurewebsites.net/api/MandelbrotTask?code=jktNGyJD2SgUSvZaNwmXN2O4eHveMpwiE/LURgIgbNRc1IhOKTSbUg==&w=600&h=400&iter=1000';
    let postTaskURL = 'https://generatetask.azurewebsites.net/api/ReturnTask?code=wOabChMwVmg8YRtOafkcpOJkrNsLhN1KU6MQCjoZK3r8uQNGhmwi/g==';

    let taskCacheSize = 10;

    let clientTaskSendAmount = 1;
    let clientRequestRefillAmount = -1;

    // Map for Tasks
    const taskCache = new Map();
    const taskQueue = new Array(); 

    this.getTag = function()
    {
        return jobTag;
    };

    this.setTag = function(str)
    {
        jobTag = str;
        console.log("Job tag set to '" + jobTag + "'...");
    };

    this.getClientTaskSendAmount = function()
    {
        return clientTaskSendAmount;
    };

    this.setClientTaskSendAmount = function(amount)
    {
        clientTaskSendAmount = amount;
        console.log("Client task send amount updated to " + amount + "...");
    };

    this.getClientRequestRefillAmount = function()
    {
        return clientRequestRefillAmount;
    };

    this.setClientRequestRefillAmount = function(amount)
    {
        clientRequestRefillAmount = amount;
        console.log("Client task refill threshold updated to " + amount + "...");
    };

    this.setTaskCacheSize = function(amount)
    {
        taskCacheSize = amount;
        console.log("Task cache size updated to " + amount + "...");
    };

    this.getTaskCacheSize = function()
    {
        return taskCacheSize;
    };

    this.getRemainingTasks = function()
    {
        return taskCache.size;
    };

    this.getCachePercent = function()
    {
        let value = Math.round((taskCache.size / taskCacheSize) * 100).toString();
        return value;
    };

    // Getter and Setter for URLs
    this.getGetTaskURL = function()
    {
        return getTaskURL;
    };

    this.getPostTaskURL = function()
    {
        return postTaskURL;
    };

    this.ClearTaskCache = function()
    {
        console.log("Clearing Task Cache and Task Queue...");
    
        taskCache.clear();
        taskQueue.length = 0;

    };

    this.setTaskURLs = function(getTask, postTask)
    {

        console.log("New GET/POST Task URLs set...");

        getTaskURL = getTask;
        postTaskURL = postTask;

        taskCache.clear();
        taskQueue.length = 0;  
    };

    // Function to get a task from source URL
    const GetTaskFromSource = function()
    {
        request.get(getTaskURL, function(error, response, body) { 

            // If 200, etc
            if (response.statusCode == 200)
            {
                while(true)
                {
                    let newSize = InsertTaskIntoCache(body);
                    
                    if (newSize == taskCacheSize) { 
                        console.log("Task Cache Full (" + newSize + ")...");
                        break;
                    }
                }    
            }
            else
            {
                console.log("Error: no task received from source URL...");    
            }

        });  

    };

    // Function to return a task to source URL    
    const PostTaskToSource = function(taskContainer)
    {

        // Remove object from taskCache
        let result = taskCache.delete(taskContainer.tid);

        // Print error if task not in cache
        if(result === false) console.log("Error: attempt made to remove non-existing task from cache...");
       
        // Create post request object containing complete task with no meta data
        let request_obj = { method: 'post', url: postTaskURL, body: taskContainer.Task, json: true };
      
        /* Send Post Request
        request.post(request_obj, function(error, response, body) {
        
            // If 200, etc
            if (response.statusCode !== 200)
            {
                console.log("Error returning complete task to source");
            }
    
        }); 

        */

    };

    // Function to generate unique ID for each task
    const GenerateTaskID = function()
    {

        while(true)
        {
            
            // Generate Random Hash
            let tid = crypto.randomBytes(20).toString('hex');

            // Check hash not already in use in cache
            let hasKey = taskCache.has(tid);

            // If it not in use, return new PID
            if (hasKey == false) return tid;
    
        }

    };

    // To insert raw json source task into panther task queue with appropriate meta data
    const InsertTaskIntoCache = function(task)
    {

        // If task is string format, convert to object
        if(typeof(task) == 'string') task = JSON.parse(task);

        // Generate unique PID id
        let tid = GenerateTaskID();

        // Wrap Task in Panther meta object with unique ID
        let taskContainer = CreateTaskContainer(tid, task);

        // Add meta object to cache map
        taskCache.set(tid, taskContainer);
    
        // Add PID to end of work queue
        taskQueue.push(tid);

        // Return current size of task cache
        return taskCache.size;

    };

    // Fill task cache to max volume
    this.FillCache = function()
    {

        console.log("Filling Task Cache...");
        console.log("Current amount of tasks in cache: " + taskCache.size)

        // Calc number of needed tasks to fill cache
        let requiredTasks = (taskCacheSize - taskCache.size > 0) ? taskCacheSize - taskCache.size : 0;

        // If 1 or more tasks needed to fill, begin fill loop
        if(requiredTasks > 0)
        {
            GetTaskFromSource();       
        }
        else
        {
            console.log("Error: task cache is full - no further tasks required");
        }

        return requiredTasks;
    };

    // Establish and return next task for client to process
    this.GetNextTask = function(sid, taskCount)
    {
 
        let taskArray = new Array();
        let requiredTasks = taskCount;
        let assignedTasks = 0;
        let sendTerminateRequest = false;    

        console.log("Task request recieved. Task Amount: " + requiredTasks + " Cache Size: " + taskCache.size);

        // Check if number of tasks within cache is available to fulfill request
        // If not available, amend taskCount and append terminate request
        if(requiredTasks > taskCache.size) {
            requiredTasks = taskCache.size;
            sendTerminateRequest = true;
            console.log("Not enough tasks in cache to fulfill request...");
        };

        let task_ids = "";

        // Get Tasks until cache empty or request fulfilled
        while (taskQueue.length > 0 && assignedTasks < requiredTasks) {
         
             // Get First Task ID Value in Queue
             let nextTaskID = taskQueue.shift();
       
             // Attempt to get Task with that ID from Cache
             let taskContainer = taskCache.get(nextTaskID);
 
             // If no task found with that ID - it has already been completed, move onto next position in queue
             if(taskContainer === undefined) continue; 
 
             // If found - put ID on back of work queue in case this client fails the task
             taskQueue.push(nextTaskID);
             
             // Add task to returned Array object
             taskArray.push(taskContainer);

             // Add task id to log string
             task_ids += nextTaskID + " ";    

             // Increment number of assigned tasks
             assignedTasks += 1;
        }

        // Write to log
        if(assignedTasks > 0) db.writeLog(jobTag, sid, task_ids, "REQUEST", "TASK", null, null, null, null);

        // If terminate message to be sent, add to array object        
        if(sendTerminateRequest == true)
        {
            taskArray.push( { status: "terminate" } );
            db.writeLog(jobTag, sid, "TERMINATE", "REQUEST", "TASK", null, null, null, null);
        };

        // return task object
        return taskArray;
 
    };

    // Function to handle task when returned from a client
    this.HandleClientResponse = function(taskContainer)
    {      
        if(taskContainer.status === 'checkpoint') HandleCheckpointTask(taskContainer);
        else if(taskContainer.status === 'complete') HandleCompleteTask(taskContainer);
        else console.log('Error received task with unknown status...');
    };

    const HandleCompleteTask = function(taskContainer)
    {

        // Attempt to get task from cache
        let oldTaskContainer = taskCache.get(taskContainer.tid);
            
        // Check task still exists in cache - if completed by another client it will have been removed
        if(oldTaskContainer !== undefined)
        {
            // Overwrite result
            taskCache.set(taskContainer.tid, taskContainer);
            
            // Write to log
            db.writeLog(jobTag, taskContainer.sid, taskContainer.tid, "RETURN", "COMPLETE", taskContainer.checkpointNumber, taskContainer.sessionTaskNumber, taskContainer.timeTaken, taskContainer.sessionDowntime);
       
            // Send Completed result back to source server
            PostTaskToSource(oldTaskContainer);

        }
        else
        {
            // Write to log
            db.writeLog(jobTag, taskContainer.sid, taskContainer.tid, "RETURN", "COMPLETE (duplicate)", taskContainer.checkpointNumber, taskContainer.sessionTaskNumber, taskContainer.timeTaken, taskContainer.sessionDowntime);
        }

    };

    const HandleCheckpointTask = function(taskContainer)
    {

        // Attempt to get task from cache
        let oldTaskContainer = taskCache.get(taskContainer.tid);
            
        // Check task still exists in cache - if completed by another client it will have been removed
        if(oldTaskContainer !== undefined)
        {
            // If returned checkpoint is higher than checkpoint in server, overwrite server value
            if(taskContainer.checkpointNumber > oldTaskContainer.checkpointNumber)
            {
                db.writeLog(jobTag, taskContainer.sid, taskContainer.tid, "RETURN", "CHECKPOINT", taskContainer.checkpointNumber, taskContainer.sessionTaskNumber, taskContainer.timeTaken, taskContainer.sessionDowntime);
                taskCache.set(taskContainer.tid, taskContainer);
            }
            else
            {
                db.writeLog(jobTag, taskContainer.sid, taskContainer.tid, "RETURN", "CHECKPOINT (earl. checkpoint)", taskContainer.checkpointNumber, taskContainer.sessionTaskNumber, taskContainer.timeTaken, taskContainer.sessionDowntime);
            }
        }
        else
        {
            db.writeLog(jobTag, taskContainer.sid, taskContainer.tid, "RETURN", "CHECKPOINT (prev. completed)", taskContainer.checkpointNumber, taskContainer.sessionTaskNumber, taskContainer.timeTaken, taskContainer.sessionDowntime);
        }

    };

};

module.exports = {
    GetTaskManager
}