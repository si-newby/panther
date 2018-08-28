"use strict";

const tm = require('../components/task_manager');
const sm = require('../components/session_manager');
const WebSocket = require('ws');
const pako = require('pako');

// Task Manager Object
taskManager = tm.GetTaskManager();

// Web Sockets Server object
let wss;

const Init = function(server)
{
    // Initiate WebSockets Server
    wss = server;
    console.log("New Web Sockets Initialized...");

    // Setup Callbacks for client connections
    wss.on('connection', function(connection) {

        console.log('Web Sockets Connection Made...');

        // On new connection, get Session ID and send to client
        let sid = JSON.stringify( { type: 'sid', sid: sm.GenerateSessionID(), taskRequestAmount: taskManager.getClientTaskSendAmount(), taskRefillAmount: taskManager.getClientRequestRefillAmount() } );
        sid = pako.deflate(sid); // New - will be binary
        connection.send(sid.buffer);

        // On receiving message from client
        connection.on('message', function(message) {
    
            // Parse string into object
            let msg = JSON.parse(pako.inflate(message, {to: 'string'}));

            // If Request for Tasks
            if(msg.type == 'request')
            {
                let tasks = JSON.stringify( {type: 'tasks', tasks: taskManager.GetNextTask(msg.sid, msg.taskCount) } );
                tasks = pako.deflate(tasks);
                connection.send(tasks.buffer);
            }
            // If Return of Checkpointed Task
            else if (msg.type == 'return')
            {
                taskManager.HandleClientResponse(msg.task);
            }
         
        });

    });
};
 
module.exports = {
    Init
};