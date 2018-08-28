const pako = require('pako');

const Timer = (function()
{
    let startTime;

    return {

        StartTimer : function()
        {
            startTime = new Date();
        },

        GetElapsedTime : function()
        {
            let endTime = new Date();
            return (endTime - startTime) / 1000;
        }
    }

})();

class Panther
{
    
    constructor()
    {
        
        this.sessionID;
        
        this.awaitingTask = false;
        this.sessionDowntime = 0;
    
        this.taskRequestProcessing = false;

        this.clientFunction;

        this.taskNumber = 0;

        this.TaskContainer;
     
        this.taskBuffer = new Array();
        this.taskBufferSize = 1;
        this.taskRefillRequestAt = -1;
        
    };

    // Functions overidden by Child Classes
    Begin()
    {
        console.log("Error: child class must implement function...");
    };

    RequestTaskFromServer()
    {
        console.log("Error: child class must implement function...");
    };

    ReturnTaskToServer()
    {
        console.log("Error: child class must implement function...");
    };
    
    // Assigns next task to be processed from local buffer
    // Assesses if task buffer needs to be refilled and initiates request
    AssignNextTask()
    {
        
        // If task available in buffer, set as current task
        if(this.taskBuffer.length > 0) {
            this.TaskContainer = this.taskBuffer.shift();
            console.log("Task taken from local buffer... (" + this.taskBuffer.length + " remains)");

            // Request async refill if refill amount reached
            if (this.taskRequestProcessing == false && this.taskRefillRequestAt == this.taskBuffer.length)
            {
                console.log("Task buffer refill threshold of " + this.taskRefillRequestAt + " reached. Requesting " + this.taskBufferSize + " tasks from server...");
                this.RequestTaskFromServer(this.taskBufferSize);
            };

        }
        // Last resort refill - attempted to get task but none available and no request in flight
        else if (this.taskRequestProcessing == false)
        {
            console.log("No tasks available in local buffer. Requesting " + this.taskBufferSize + " tasks from server...");
            this.RequestTaskFromServer(this.taskBufferSize);
        };

        // If Task successfully assigned, process it
        if(this.TaskContainer)
        { 
            // if previously failed attempt at task, record time taken to get new task
            if(this.awaitingTask == true)
            {
                this.sessionDowntime += Timer.GetElapsedTime();
                this.awaitingTask = false;
                console.log("Session downtime: " + this.sessionDowntime);
            }
            
            this.ProcessNextTask();
        }
        // If task unsuccesfully assigned
        else
        {
            this.awaitingTask = true;
            Timer.StartTimer();
        };
       
    };

    ProcessNextTask()
    {

        // Check for termination message - break client execution if so
        if (this.TaskContainer.status === 'terminate')
        {
            console.log("Termination request received...");    
            return;
        } 
        
        // Print details of next task
        console.log("Current Task: " + this.TaskContainer.tid + " Status: " + this.TaskContainer.status + "(" + this.TaskContainer.checkpointNumber + ")");
     
        // Increment Task Count
        this.taskNumber++;

        // Print Start Message
        console.log("Starting Task " + this.taskNumber + "...");

        // Start Timer
        Timer.StartTimer();

        // Pass Task to client function to process
        this.clientFunction(this.TaskContainer.Task);

        // If function returns, task completed
        this.CompleteTask();

        // Clear Current Task and Try and Assign Next Task
        this.TaskContainer = null;
        this.AssignNextTask();

    };

    CompleteTask()
    {

        this.TaskContainer.status = "complete";
        this.TaskContainer.checkpointNumber++;
        this.TaskContainer.sid = this.sessionID;
        this.TaskContainer.sessionTaskNumber = this.taskNumber;
        this.TaskContainer.sessionDowntime = this.sessionDowntime;
        this.TaskContainer.timeTaken = Timer.GetElapsedTime();
        console.log("Task Completed... " + this.TaskContainer.timeTaken + "s");
        this.ReturnTaskToServer();  
    };

    CheckpointTask()
    {
        this.TaskContainer.status = "checkpoint";
        this.TaskContainer.checkpointNumber++;
        this.TaskContainer.sid = this.sessionID;
        this.TaskContainer.sessionTaskNumber = this.taskNumber;
        this.TaskContainer.sessionDowntime = this.sessionDowntime;
        this.TaskContainer.timeTaken = Timer.GetElapsedTime();
        console.log("Task Checkpointed..."  + this.TaskContainer.timeTaken + "s");
        this.ReturnTaskToServer();   
    };

    get SessionID()
    {
         return this.sessionID;
    };

    get TaskNumber()
    {
         return this.taskNumber;
    };

    get TaskID()
    {
        return this.TaskContainer.tid;
    };

    set ReceiveTaskFunction(func)
    {
        this.clientFunction = func;
        console.log("Client Function Set...");
    };

    set TaskBufferSize(size)
    {
        this.taskBufferSize = size;
        console.log("Task Buffer Size Set To: " + this.taskBufferSize);
    };

    set TaskBufferRefillSize(size)
    {
        this.taskRefillRequestAt = size;
        console.log("Task Buffer Refill Size Set To: " + this.taskRefillRequestAt);
    };

};

class PantherXHR extends Panther
{
    
    constructor() 
    {

        super();
    
        console.log("PantherXHR object created...");

        this.sessionURL;
        this.getURL;
        this.postURL;

    };

    set SessionURL(url)
    {
        this.sessionURL = url;
        console.log("Session URL address set to: " + this.sessionURL);
    };

    set GetURL(url)
    {
        this.getURL = url;
        console.log("GET URL address set to: " + this.getURL);
    };

    set PostURL(url)
    {
        this.postURL = url;
        console.log("POST URL address set to: " + this.postURL);
    };
    
    // Function which ensures all required variables set
    // Gets session ID, and then begins task processing loop
    Begin() 
    {
      
        // Confirm required attributes are set
        if ((this.sessionURL && this.getURL && this.postURL && this.clientFunction) == false)
        {
            console.log("Error: required attributes not set...");
            return; 
        };
              
        // If required attributes set - get new session ID
        console.log("Requesting Session ID...");
      
        // Create new XHR object
        let panther = this;
        let request = new XMLHttpRequest();
        
        // Assign callback function once request fulfilled
        request.addEventListener("load", function() {

            if(request.status == 200)
            { 

                let msg = JSON.parse(request.response)

                // Set Session ID and request first task
                panther.sessionID = msg.sid;
                panther.taskBufferSize = msg.taskRequestAmount; 
                panther.taskRefillRequestAt = msg.taskRefillAmount; 
 
                console.log("Session ID received: " + panther.sessionID);
                console.log("Task Request Amount Set to: " + panther.taskBufferSize);
                console.log("Task request will occur when local buffer has " + panther.taskRefillRequestAt + " tasks remaining");    
             
                // Start Task Processing Loop
                panther.AssignNextTask();
            }
            else
            {
                console.log("Error receiving Session ID...");
            }
        
        });
      
        // Initiate request
        request.open("GET", this.sessionURL);
        request.send();
    
    };

     // Requests tasks from server
    // Initiates task processing if no current tasks being worked
    RequestTaskFromServer(taskCount)
    {
        
        // Set request processing to true
        this.taskRequestProcessing = true;

        // Create new XHR object
        let panther = this;
        let request = new XMLHttpRequest();

        // Assign callback function once request fulfilled
        request.addEventListener("load", function() {

            if(request.status == 200)
            { 
                let receivedTasks = JSON.parse(request.response);
                panther.taskBuffer = panther.taskBuffer.concat(receivedTasks);
                console.log(receivedTasks.length + " tasks received and appended to task buffer...");

                // Set request processing to false
                panther.taskRequestProcessing = false;

                // If no task being processed, start processing
                if(!panther.TaskContainer) panther.AssignNextTask();
            }   
            else
            {
                console.log("Error receiving Task(s)...");
            }    
        });

        // Initiate request
        request.open("GET", this.getURL  + "?sid=" + this.sessionID + "&taskCount=" + taskCount);
        request.send();
    };

    ReturnTaskToServer()
    {
        
        let returnType = this.TaskContainer.status; 

        // Create new XHR object
        let request = new XMLHttpRequest();
        request.open("POST", this.postURL + "?sid=" + this.sessionID); // Remember this is now sync
        request.setRequestHeader("Content-Type", "application/json");

        // Display error message if post response not received
        request.onreadystatechange = function() {
            if(request.readyState == XMLHttpRequest.DONE && request.status !== 200) console.log("Error Returning Task...");
        }
        
        // Zip JSON object to binary
        let msg = { data: btoa(pako.deflate(JSON.stringify(this.TaskContainer), {to: 'string'})) };
        // let test = JSON.parse(pako.inflate(atob(msg.data), {to: 'string'}));
 
        // Test converting back
        request.send(JSON.stringify(msg)); 
 
    };

};

// Do web sockets implementation
class PantherWS extends Panther
{

    constructor() 
    {

        console.log("PantherWS object created...");

        super();

        // Web Socket Connection
        this.socket;

    };

    Begin()
    {

        // Store reference to panther object
        let panther = this;

        // Connect To Server with websocket
        // this.socket = new WebSocket('ws://localhost:3000/ws');
        this.socket = new WebSocket('ws://wbpfserv.xyz:8081/ws');
        this.socket.binaryType = 'arraybuffer'; // New

        // On opening of connection
        this.socket.onopen = function(event) {
            console.log("Websocket Connection Opened...");
        };

        // On receiving message from Server
        this.socket.onmessage = function(event) {
    
            // Parse into Object
            let msg = JSON.parse(pako.inflate(event.data, {to: 'string'}));

            // If Session ID, set it and beginning task processing loop
            if(msg.type == 'sid')
            {
                // Set Session ID and request first task
                panther.sessionID = msg.sid;
                panther.taskBufferSize = msg.taskRequestAmount; 
                panther.taskRefillRequestAt = msg.taskRefillAmount; 

                console.log("Session ID received: " + panther.sessionID);
                console.log("Task Request Amount Set to: " + panther.taskBufferSize);
                console.log("Task request will occur when local buffer has " + panther.taskRefillRequestAt + " tasks remaining");    

                // Start Task Processing
                panther.AssignNextTask();

            }
            else if(msg.type == 'tasks')
            {
                panther.taskBuffer = panther.taskBuffer.concat(msg.tasks);
                console.log(msg.tasks.length + " tasks received and appended to task buffer...");

                // If no task being processed, start processing
                if(!panther.TaskContainer) panther.AssignNextTask();
            };
        };

        // On WebSockets Closure of Connection
        this.socket.onclose = function(event) {
            console.log("Websocket Connection Closed...");
        };

    };

    RequestTaskFromServer(taskCount)
    {
  
        let msg = JSON.stringify( { type: 'request', sid: this.sessionID, taskCount: this.taskBufferSize } );    
        msg = pako.deflate(msg);
        this.socket.send(msg.buffer);
    };

    ReturnTaskToServer()
    {

        let msg = JSON.stringify( { type: 'return', task: this.TaskContainer } );    
        msg = pako.deflate(msg);
        this.socket.send(msg.buffer);

    };

};

module.exports = {
    Timer,
    PantherWS,
    PantherXHR
}