"use strict";

var path = require('path');

let scriptPath = "";
let currentScript = "mandelbrot_ws.js";

const setScriptPath = function(path)
{
    scriptPath = path;
    console.log("Task Script path set to '" + scriptPath + "'...");
};

const setCurrentScript = function(script)
{
    currentScript = script;
};

const getCurrentScript = function()
{
    return currentScript;
};

const getTaskScript = function(req, res, next)
{
    res.sendFile(path.join(scriptPath, currentScript));
};
  
module.exports = {
    getTaskScript, 
    setScriptPath,
    setCurrentScript,
    getCurrentScript
};