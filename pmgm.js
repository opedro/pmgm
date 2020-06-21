app = require('express')();
bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())



fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Content-Type', 'Application/JSON');

    next();
}


app.use(allowCrossDomain);

const projects = './projects/';

app.get('/', (req, res) => {
    res.send("OKAY, LETS PLAY! CALL API: /play?project=<projectCode>&lastStatus=<status>&option=<option>");
});
//should receive <url>/play?project=<projectCode>
app.get('/play', (req, res) => {
    if (req.query.project) {
        console.log("Iniciando " + req.query.project + "...");
        res.send(letsPlay(req.query.project, req.query.lastStatus, req.query.option));
    } else {
        throw (new Error({ 'message': 'missing parameter' }));
    }
});

app.listen(80, function () {
    console.log('QUE O JOGO COMECE NA PORTA: ', 80);
});

//Define status start a turn
function letsPlay(project, status = false, action = "") {
    console.log("Status: " + status + "...");
    var nowStatus = {}
    loadProject(project, (runningProject) => {
        if (status) {
            nowStatus = {
                'week': status.substring(status.indexOf("w") + 1, status.indexOf("d")),
                'deadLine': status.substring(status.indexOf("d") + 1, status.indexOf("f")),
                'feeling': status.substring(status.indexOf("f") + 1),
                'action': action
            }
        } else {
            nowStatus = {
                'week': 1,
                'deadLine': runningProject.deadlineInit,
                'feeling': runningProject.feelingInit,
                'action': action
            }
        }

        var update = runTurn(runningProject, nowStatus);
        console.log(update);
        return update;
    })
};

//Loads level
function loadProject(project, callback) {
    fs.readFile(projects + '/' + project + '.json', 'utf8', function (err, content) {
        callback(JSON.parse(content));
    });
};

//Get the new situation based on status and send back an update
function runTurn(runningProject, nowStatus) {
    console.log("TURN!");
    var evento, update, effects;
    if (nowStatus.action !== "") {
        if (nowStatus.deadLine / runningProject.deadlineInit <= 1 && nowStatus.feeling > 5) {
            evento = runningProject.events.find(events => events.hist == 'up' && events.week == nowStatus.week);
        } else {
            evento = runningProject.events.find(events => events.hist == 'down' && events.week == nowStatus.week);
        }
        effects = evento.actions.find(actions => actions.option == nowStatus.action);
        nowStatus.week++;
        nowStatus.deadLine = Number(nowStatus.deadLine) + Number(effects.deadlineEffect);
        nowStatus.feeling = Number(effects.feelingEffect) + Number(nowStatus.feeling);
        update = {
            'week': evento.week,
            'type': evento.type,
            'description': evento.description,
            'action': evento.actions,
            'status': 'w' + nowStatus.week + 'd' + nowStatus.deadLine + 'f' + nowStatus.feeling
        }
    } else {
        if (nowStatus.deadLine / runningProject.deadlineInit <= 1 && nowStatus.feeling > 5) {
            evento = runningProject.events.find(events => events.hist === 'up' && events.week == nowStatus.week);
        } else {
            evento = runningProject.events.find(events => events.hist === 'down' && events.week == nowStatus.week);
        }
        update = {
            'week': evento.week,
            'type': evento.type,
            'description': evento.description,
            'action': evento.actions,
            'status': 'w' + nowStatus.week + 'd' + nowStatus.deadLine + 'f' + nowStatus.feeling
        }
    }
    return update;


}