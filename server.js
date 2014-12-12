var express = require("express");
var app = express();
var path = require('path');
var _ = require('underscore');

var userMap = {};
var userpass64 = "";
var nowServing = 100;
var staticDir = path.resolve(__dirname);

app.use('/remoteValues/', express.static(staticDir));

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.favicon('./public/assets/favicon.ico'));

var port = process.env.PORT || 8080;


function onUserDomain(myData) {
    var userDomain = myData.domain;
    userMap[i_user] = userDomain;
    //alert(userDomain);
    send();
}

function sendCommand(i_domain, i_user, i_password, i_stationId, i_senderName, i_param) {
    if (i_param == undefined) {
        i_param = "";
    }
    var userDomain = userMap[i_user];
    if (userDomain == null) {
        var userPass = i_user + "," + i_password;
        var param = $.base64.encode(userPass);
        param = param.replace(/=/g, ".");
        param = param.replace(/[+]/g, "_");
        var userpass64 = param.replace(/[/]/g, "-");

        var url1 = 'https://galaxy.signage.me/WebService/getUserDomain.ashx?i_userpass=' + userpass64 + '&callback=?';
        $.getJSON(url1, onUserDomain);
    }
    else {
        send();
    }

    function send() {
        var url2 = 'http://' + userDomain + '/WebService/sendCommand.ashx?i_userpass=' + userpass64 + '&i_stationId=' + i_stationId + '&i_command=event' + '&i_param1=' + i_senderName + '&i_param2=' + i_param + '&callback=?';
        //alert(url2);
        $.getJSON(url2, onSendCommand);
    }

    function onSendCommand(myData) {
        //alert("onSendCommand");
    }
}

var startServer = function (port, fn) {
    var net = require('net');
    var tester = net.createServer()
        .once('error', function (err) {
            if (err.code == 'EADDRINUSE')
                return fn(err);
            fn(null);
        })
        .once('listening', function () {
            tester.once('close', function () {
                fn(null, false)
            }).close()
        })
        .listen(port)
};


startServer(8080, function (err) {
    if (err) {
        console.log('\nport ' + port + ' is busy, try using a different port by editing server.js\n');
        process.exit();
    }
    app.listen(port, function () {
        console.log('\n========================================================================================\n');
        console.log("Server is listening on port " + port + "\n");
        console.log("Now open a browser and point it to http://localhost:8080/remoteValues/nowServing.html");
        console.log('\n========================================================================================\n');
    });

    app.all('/nowServing', function (req, res) {
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        res.send('{"nowServing": "' + nowServing + '"}');
    });

    app.all('/next', function (req, res) {
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        if (_.size(req.body) == 0) {
            res.end();
            return false;
        }
        res.send('{"nowServing": "' + ++nowServing + '"}');
        sendCommand("galaxy.signage.me", "d25@ms.com", "xxx", "74", "setval", nowServing);
    });

    app.all('/prev', function (req, res) {
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        if (_.size(req.body) == 0) {
            res.end();
            return false;
        }
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Origin", "*");
        res.send('{"nowServing": "' + --nowServing + '"}');
        sendCommand("galaxy.signage.me", "d25@ms.com", "xxx", "74", "setval", nowServing);
    });


});

