const p = require('../tasks_dev/panther.new');

let panther = new p.PantherXHR();

// panther.ReceiveTaskFunction = pi;
const pi = function(task)
{

    let x_coord, y_coord;

    while(task.current_throw < task.total_throws)
    {

        // Generate random number for x and y coordinates
        x_coord = Math.random();
        y_coord = Math.random();

        if (((x_coord * x_coord) + (y_coord * y_coord)) <= 1.0)
        {
            task.current_hits++;        
        }

        task.current_throw++;

        // Checkpoint every 100 million
        if(task.current_throw != 0 
            && task.current_throw != task.total_throws
            && task.current_throw % 50000000 == 0) panther.CheckpointTask();
    
    }

    task.pi_estimate = 4.0 * (task.current_hits/task.total_throws);

    // Post Message to browser
    // postMessage([panther.TaskID, panther.TaskNumber, task.total_throws, task.current_hits, task.pi_estimate, panther.SessionID]);
    postMessage(['pi', panther.SessionID, panther.TaskID, panther.TaskNumber, task.total_throws, task.current_hits, task.pi_estimate]);

};

panther.SessionURL = "http://www.wbpfserv.xyz/task/session";
panther.GetURL = "http://www.wbpfserv.xyz/task/get";
panther.PostURL = "http://www.wbpfserv.xyz/task/post";
panther.ReceiveTaskFunction = pi; 
panther.Begin();
