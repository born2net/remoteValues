var express = require("express");
var app = express();
var path = require('path');
var $ = require('jquery').create();
exports.$ = $;
var _ = require('underscore');

///////////////
// config
///////////////
var user = 'd25@ms.com'
var pass = '123123';
var stationID = 217;
var refreshTimer = 5000;

var userpass64 = "";
var nowServing = 100;
var staticDir = path.resolve(__dirname);
var domain = '';

app.use('/remoteValues/', express.static(staticDir));
app.use(express.bodyParser());
app.use(express.methodOverride());

var port = process.env.PORT || 8080;

function getDomain() {
    var userPass = user + "," + pass;
    var param = (new Buffer(userPass).toString('base64'));
    param = param.replace(/=/g, ".");
    param = param.replace(/[+]/g, "_");
    userpass64 = param.replace(/[/]/g, "-");
    var url1 = 'https://galaxy.signage.me/WebService/getUserDomain.ashx?i_userpass=' + userpass64;
    $.get(url1, function (data) {
        var regexp = /(domain: ")(.*)(.signage)/ig;
        domain = regexp.exec(data)[2];
        // hack workaround until setval fixed
        sendCommand("next", '10');
    });
}

function sendCommand(i_event, i_value) {
    console.log('sending ' + i_value);
    var url2 = 'http://' + domain + '.signage.me/WebService/sendCommand.ashx?i_userpass=' + userpass64 + '&i_stationId=' + stationID + '&i_command=event' + '&i_param1=' + i_event + '&i_param2=' + i_value + '&callback=?';
    $.get(url2, function (data) {
    });
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

getDomain();

setInterval(function () {
    sendCommand("setval", nowServing);
}, refreshTimer);

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
        sendCommand("setval", nowServing);
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
        sendCommand("setval", nowServing);
    });


});

