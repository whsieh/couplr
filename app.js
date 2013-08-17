
/**
* Module dependencies.
*/

var express = require('express')
 , mongodb = require('mongodb')
 , routes = require('./routes')
 , about = require('./routes/about') // ABOUT
 , match = require('./routes/match') // MATCH
 , profile = require('./routes/profile') // PROFILE
 , ShiprProvider = require('./shipr-provider').ShiprProvider
 , http = require('http')
 , https = require('https')
 , path = require('path');

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/shipr';

var SOCKET_PORT = 1337,
    APP_PORT = 5000,
    SERVER_PORT = 27017

var app = express();
var io = require('socket.io').listen(SOCKET_PORT)
io.set('log level', 1)

app.configure(function(){
    app.set('port', process.env.PORT || APP_PORT);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', routes.index);

// Additional pages...
app.get('/about', about);
app.get('/match', match);
app.get('/profile', profile);

console.log('[~] Connecting to MongoDB...');
app.shiprProvider = new ShiprProvider(mongoUri,SERVER_PORT,app,APP_PORT);

io.sockets.on('connection',function(socket) {
    socket.emit('status',{msg:'connection established'})
    socket.on('get-network',function(data) {
        var token = data[0],
            uid = data[1].toString()
        validateToken(token,uid,function() {
            app.shiprProvider.findNetwork(uid,function(err,res) {
                if (!err) {
                    socket.emit('get-network-resp',res)
                }
            })
        })
    })
    socket.on('write-network',function(data) {
        var token = data[0],
            nw = data[1]
        validateToken(token,nw.root,function() {
            app.shiprProvider.writeNetwork(nw,function(err,res) {})
        })
    })
    socket.on('check-token',function(data) {
        var token = data[0],
            uid = data[1].toString()
        validateToken(token,uid,function() {})
    })
    socket.on('get-matches',function(args) {
        var atoken = args[0],
            uid = args[1].toString()
        validateToken(atoken,uid,function() {
            app.shiprProvider.findMatchesByIds(args.slice(2),function(err,res) {
                if (res) {
                    var data = []
                    for (var i = 0; i < res.length; i++) {
                        var hasvoted = 'no'
                        if (uid in res[i].voted) {
                            hasvoted = res[i].voted[uid]
                        }
                        data.push({a:res[i].a,
                            b:res[i].b,
                            up:res[i].up,
                            down:res[i].down,
                            skip:res[i].skip,
                            voted:hasvoted
                        })
                    }
                    socket.emit('get-match-resp',data)
                }
            })
        })
    })
    socket.on('get-matches-init',function(args) {
        var atoken = args[0],
            uid = args[1].toString()
        validateToken(atoken,uid,function() {
            app.shiprProvider.findMatchesByIds(args.slice(2),function(err,res) {
                if (res) {
                    var data = []
                    for (var i = 0; i < res.length; i++) {
                        var hasvoted = 'no'
                        if (uid in res[i].voted) {
                            hasvoted = res[i].voted[uid]
                        }
                        data.push({a:res[i].a,
                            b:res[i].b,
                            up:res[i].up,
                            down:res[i].down,
                            skip:res[i].skip,
                            voted:hasvoted
                        })
                    }
                    socket.emit('get-init-resp',data)
                }
            })
        })
    })
    socket.on('get-match',function(args) {
        if (args.length >= 4) {
            var atoken = args[0]
            var uid = args[1].toString()
            var id1 = args[2].toString()
            if (args[3] != null) {
                var id2 = args[2].toString()
                validateToken(atoken,uid,function() {
                    app.shiprProvider.findMatchesById(id1,id2,function(err,res) {
                        if (res) {
                            var hasvoted = 'no'
                            if (uid in res.voted) {
                                hasvoted = res.voted[uid]
                            }
                            socket.emit('get-match-resp',{
                                a:res.a,
                                b:res.b,
                                up:res.up,
                                down:res.down,
                                skip:res.skip,
                                voted:hasvoted
                            })
                        }
                    })
                })
            } else {
                validateToken(atoken,uid,function() {
                    app.shiprProvider.findMatchesById(id1,null,function(err,res) {
                        if (res) {
                            var data = []
                            for (var i = 0; i < res.length; i++) {
                                var hasvoted = 'no'
                                if (uid in res[i].voted) {
                                    hasvoted = res[i].voted[uid]
                                }
                                data.push({a:res[i].a,
                                    b:res[i].b,
                                    up:res[i].up,
                                    down:res[i].down,
                                    skip:res[i].skip,
                                    voted:hasvoted
                                })
                            }
                            socket.emit('get-match-resp',data)
                        }
                    })
                })
            }
        }
    })
    socket.on('add-match',function(args) {
        if (args.length >= 5) {
            var atoken = args[0]
            var uid = args[1].toString()
            var id1 = args[2].toString()
            var id2 = args[3].toString()
            var r = args[4]
            validateToken(atoken,uid,function() {
                app.shiprProvider.updateMatchById(uid,id1,id2,r,function(err,res) {
                    if (res != undefined) {
                        socket.emit('add-match-resp',res)
                    }
                })
            })
        }
    })
})

function validateToken(atoken,uid,callback) {
    var options = {
        host: 'graph.facebook.com',
        path: '/debug_token?input_token=' + atoken + '&access_token=582584861772287|s2DbRfvswjulEw6Qg7u7MvM3kQU'
    }
    https.get(options,function(res) {
        res.setEncoding('utf8')
        buffer = ''
        res.on('data',function(chunk) {
            buffer += chunk
        })
        res.on('end', function(){
            var data = JSON.parse(buffer).data
            if (data && data.user_id==uid) {
                console.log('[+] Access token validated.')
                callback()
            } else {
                console.log('[-] Access DENIED hueheuhehuehhue.')
            }
        });
    }).on('error',function(e) {
        console.log('[-] Error validating ' + uid)
    })
}

setTimeout(function() {
    console.log('[~] Testing database...')
    app.shiprProvider.db.collection('matches',function(err,matches) {
        if (err) { throw err; }
        else {
            matches.findOne({test:'response'},function(err,res) {
                if (err) { throw err; }
                else {
                    if (res != null) {
                        console.log('[+] Test response received!')
                    } else {
                        console.log('[-] Test response failed.')
                    }
                }
            })
        }
    })
},2000)