(function () {

    let timer;
    const responseList = document.getElementById('response-list');
    const responseElements = responseList.getElementsByTagName('li');

    const removeElement = function()
    {
        if(responseElements.length > 0)
        {
            responseList.removeChild(responseList.childNodes[0]);
        }
        else clearInterval(timer);
       
    }
    
    //- Set Interval
    if(responseElements.length > 0) timer = setInterval(removeElement, 2500);
    
})();