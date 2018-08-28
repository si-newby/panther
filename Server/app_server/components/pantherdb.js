"use strict";

var mysql = require('mysql');

var connection_details = {
    host     : "adminlogdb.cszttftms1yt.eu-west-2.rds.amazonaws.com",
    user     : "simonnewby84",
    password : "bounc1ng672",
    port     : "3306",
    database : "panther"
};

const conHandle = function(err){
    if(err) console.log("Error connecting database ...");  
};

const querHandle = function(err, rows, fields) {
    if(err) console.log('Error while performing Query.');
};

const disHandle = function(err){
    if(err) console.log("Error disconnecting from database ...");  
};

const clearLog = function()
{

    console.log("Clearing log table...");

    let connection = mysql.createConnection(connection_details);

    let sql = "TRUNCATE TABLE log";

    connection.connect(conHandle);
    connection.query(sql, querHandle); 
    connection.end(disHandle);

};

const writeLog = function(tag, session_id, task_id, request_type, request_desc, task_checkpoint, task_number, processing_time, down_time) {

    let connection = mysql.createConnection(connection_details);
    
    let sql = "INSERT INTO log (tag, session_id, task_id, request_type, request_desc, task_checkpoint, task_number, processing_time, down_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    let inserts = [tag, session_id, task_id, request_type, request_desc, task_checkpoint, task_number, processing_time, down_time];
    sql = mysql.format(sql, inserts);

    connection.connect(conHandle);
    connection.query(sql, querHandle);
    connection.end(disHandle);
};

module.exports = {
    clearLog,
    writeLog
}