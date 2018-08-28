
class ProgressBar {

    constructor(barID, textID, requestUrl, time)
    {
        this.bar = document.getElementById(barID);
        this.text = document.getElementById(textID);
        this.url = requestUrl;    
        this.timer = setInterval(this.RequestUpdate.bind(this), time);
    };

    RequestUpdate()
    {
          
        let request = new XMLHttpRequest();
 
        // Assign callback function once request fulfilled
        request.addEventListener("load", function() {
 
             if(request.status == 200)
             { 
                let res = JSON.parse(request.response);
                this.bar.style.width = res.percent + "%";

                if(res.value > 0 || typeof(res.value) == "string") this.text.textContent = res.value;
                else this.text.textContent = ""; 
             }   
             else
             {
                 console.log("Error requesting update...");
             }    
         }.bind(this));
 
         // Initiate request
         request.open("GET", this.url);
         request.send();

    };
}

window.onload = function()
{ 

    let taskCounter = new ProgressBar("taskProgressBar", "taskProgressText", "http://www.wbpfserv.xyz/status?type=tasks", 1000);
    let memoryCounter = new ProgressBar("memoryProgressBar", "memoryProgressText", "http://www.wbpfserv.xyz/status?type=memory", 3000);
}