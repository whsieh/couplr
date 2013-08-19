var matchData = {}
var socket = io.connect()//'http://couplr.herokuapp.com')

var MM=[],MF=[],FM=[],FF=[]
var SESSIONLENGTH =  72 // in hours
var MIN_SCORE_0 = 0
var MIN_SCORE_1 = 0.25
var MIN_SCORE_2 = 0.75
var NOISE = 0

var SESSION_VOTES = {}

socket.on('status',function(data) {
	if (data.msg == 'connection established') {
		console.log('(+) socket.io: connection established.')
	} else {
		console.log('(-) socket.io: error connecting to server')
	}
})
socket.on('get-network-resp',function(data) {
	// Server responds with network data
	var ctime = round(new Date().getTime()/1000)
	if (data) {
		var dt = round(ctime - data.time)/3600
		if (dt < SESSIONLENGTH) {
			console.log('(+) Recent network found (~'+floor(round(dt*100)/100)+' hour[s] ago)...building network.')
			usePreMatches = false
			initFromCache(data)
			loadMatches(500)
			setInterval(loadContinuousMatches,1000)
		} else {
			console.log('(+) Outdated network found (~'+floor(round(dt*100)/100)+' hour[s] ago)...update required.')
			pastData = data
			loadMatches()
			initFromStream()
		}
	} else {
		console.log('(~) No network found.')
		loadMatches()
		initFromStream()
	}
	blocked = false
	$.unblockUI({
		fadeOut:800
	})
	initMatchUI()
})
socket.on('add-match-resp',function(data) {
	console.log(data)
})
socket.on('get-init-resp',function(data) {
	// Server responds with all relevant matches
	if (data.length) {
		data.forEach(function(item) {
			var m = {
				up: item.up || 0,
				down: item.down || 0,
				skip: item.skip || 0,
				voted: item.voted
			}
			if (item.a in matchData) {
				matchData[item.a][item.b] = m
			} else {
				matchData[item.a] = {}
				matchData[item.a][item.b] = m
			}
			if (item.b in matchData) {
				matchData[item.b][item.a] = m
			} else {
				matchData[item.b] = {}
				matchData[item.b][item.a] = m
			}
		})
	} else {
		var m = {
			up: data.up || 0,
			down: data.down || 0,
			skip: data.skip || 0,
			voted: data.voted
		}
		if (data.a in matchData) {
			matchData[data.a][data.b] = m
		} else {
			matchData[data.a] = {}
			matchData[data.a][data.b] = m
		}
		if (data.b in matchData) {
			matchData[data.b][data.a] = m
		} else {
			matchData[data.b] = {}
			matchData[data.b][data.a] = m
		}
	}
	console.log('(+) Friends\' match data fetched.')
    // <5> Check cache for network
    queryNetwork()
})
socket.on('get-match-resp',function(data) {
	console.log(data)
	if (data.length) {
		data.forEach(function(item) {
			var m = {
				up: item.up || 0,
				down: item.down || 0,
				skip: item.skip || 0,
				voted: item.voted
			}
			if (item.a in matchData) {
				matchData[item.a][item.b] = m
			} else {
				matchData[item.a] = {}
				matchData[item.a][item.b] = m
			}
			if (item.b in matchData) {
				matchData[item.b][item.a] = m
			} else {
				matchData[item.b] = {}
				matchData[item.b][item.a] = m
			}
		})
	} else {
		var m = {
			up: data.up || 0,
			down: data.down || 0,
			skip: data.skip || 0
		}
		if (data.a in matchData) {
			matchData[data.a][data.b] = m
		} else {
			matchData[data.a] = {}
			matchData[data.a][data.b] = m
		}
		if (data.b in matchData) {
			matchData[data.b][data.a] = m
		} else {
			matchData[data.b] = {}
			matchData[data.b][data.a] = m
		}
	}
})

function valid(id1,id2) {
	var info1 = nw.contacts[id1],
		info2 = nw.contacts[id2]
	if (info1.gender === info2.interest &&
		info1.interest === info2.gender) {
		if (!info1.age || !info2.age) {
			return true
		} else {
			var a1 = info1.age,
				a2 = info2.age
			return (max(a1,a2)/2 + 7 > min(a1,a2))
		}
	} else {
		return false
	}
}

function hScore(id1,id2,checkvalid) {
	checkvalid = (checkvalid===undefined) ? true : checkvalid
	if (checkvalid && !valid(id1,id2)) {
		return -Infinity
	}
	if (usePreMatches) {
		if (pastData) {
			// At least it's not a first-time user
			var i = ((id1 in pastData.adj) ? 0.2 : 0) + ((id2 in pastData.adj) ? 0.2 : 0)
			if (i < 0.4) {
				return i
			} else {
				if (id1 in pastData.adj[id2]) {
					return i + 0.2*pastData.adj[id2][id1]
				} else {
					return i
				}
			}
		} else {
			// We know nothing about the network
			return 0
		}
	} else {
		// We have full network data
		var i = ((id1 in nw) ? 0.2 : 0) + ((id2 in nw) ? 0.2 : 0)
		if (i < 0.4) {
			return i
		} else {
			var inv = nw.invdist(id1,id2)
			var bfs = nw.bfsdist(id1,id2)
			return i + (1/(inv+bfs))
		}
	}
}

function dScore(id1,id2,votedpenalty) {
	if (!valid(id1,id2)) {
		return -Infinity
	}
	var m = null
	if (id1 in matchData && id2 in matchData[id1]) {
		m = matchData[id1][id2]
	} else {
		m = {
			up:0,
			down:0,
			skip:0,
			voted:'no'
		}
	}
	if (votedpenalty && m.voted != 'no') {
		return -Infinity
	}
	return m.up - (0.5*m.skip) - (0.25*m.down)
}

function loadMatches(samplecount) {
	var mcount = 0
	samplecount = samplecount || 100
	var exectime = new Date().getTime()
	if (usePreMatches) {
		var mlist = preMatches
		if (pastData) {
			var clist = Object.keys(pastData.adj)
		} else {
			var clist = Object.keys(nw.contacts)
		}
	} else {
		var mlist = matches
		var clist = nw.vlist
	}
	samples = {}
	for (var i = 0; i < samplecount; i++) {
		var id1 = clist.random(), id2 = null
		if (id1 && id1 != nw.rootID) {
			var g1 = nw.gender(id1), i1 = nw.interest(id1)
			if (g1=='m') {
				if (i1=='m') {
					id2 = MM.random().id
				} else if (i1=='f') {
					id2 = FM.random().id
				}
			} else if (g1=='f') {
				if (i1=='m') {
					id2 = MF.random().id
				} else if (i1=='f') {
					id2 = FF.random().id
				}
			}
			if (id2 && id1 != id2 && id2 != nw.rootID) {
				var s = hScore(id1,id2) + dScore(id1,id2,true) + NOISE*random()
				if (usePreMatches) {
					if (pastData) {
						if (s >= MIN_SCORE_1) {
							samples[combineID(id1,id2)] = s
						}
					} else {
						if (s >= MIN_SCORE_0) {
							samples[combineID(id1,id2)] = s
						}
					}
				} else {
					if (s >= MIN_SCORE_2) {
						samples[combineID(id1,id2)] = s
					}
				}
				
			}
		}
	}
	for (var ckey in samples) {
		if (!(ckey in SESSION_VOTES || ckey in currentMatches)) {
			var idpair = splitID(ckey)
			mlist.push([idpair[0],idpair[1],samples[ckey]])
			SESSION_VOTES[ckey] = true
			currentMatches[ckey] = true
			mcount++
		}
	}
	exectime = new Date().getTime() - exectime
	console.log('(+) Found ' + mcount + ' matches in ' + exectime + ' ms.')
}

function writeNetwork() {
	socket.emit('write-network',[ATOKEN,nw.serialize()])
}

function queryNetwork() {
	// Request network info from server
	socket.emit('get-network',[ATOKEN,nw.rootID])
}

function checkToken() {
	socket.emit('check-token',[ATOKEN,nw.rootID])
}

function queryInitMatches() {
	var idlist = Object.keys(nw.contacts)
	idlist.unshift(nw.rootID)
	idlist.unshift(ATOKEN)
	// Request all match info from server
	socket.emit('get-matches-init',idlist)
}

function addMatch(id1,id2,r) {

	r = r || 'skip'
	
	var item = null
	if (id1 in matchData && id2 in matchData[id1]) {
		item = matchData[id1][id2]
	}
	if (item) {
		var prevR = item.r
		if (prevR === 'up') {
			item.up -= 1
		} else if (prevR === 'down') {
			item.down -= 1
		} else if (prevR === 'skip') {
			item.skip -= 1
		}
		var m = {
			up: item.up + (r=='up' ? 1 : 0),
			down: item.down + (r=='down' ? 1 : 0),
			skip: item.skip + (r=='skip' ? 1 : 0),
			voted: r
		}
	} else {
		var m = {
			up: (r=='up' ? 1 : 0),
			down: (r=='down' ? 1 : 0),
			skip: (r=='skip' ? 1 : 0),
			voted: r
		}
	}
	if (id1 in matchData) {
		matchData[id1][id2] = m
	} else {
		matchData[id1] = {}
		matchData[id1][id2] = m
	}
	if (id2 in matchData) {
		matchData[id2][id1] = m
	} else {
		matchData[id2] = {}
		matchData[id2][id1] = m
	}
	// console.log('Updating client-side ' + id1 + ' and ' + id2)
	// console.log(matchData[id1][id2])
	SESSION_VOTES[combineID(id1,id2)] = true
	socket.emit('add-match',[ATOKEN,nw.rootID,id1,id2,r])
}

function printMatches(m) {
	if (m.length != 3 || typeof(m[2])!='number') {
		for (var i = 0; i < m.length; i++) {
			printMatches(m[i])
		}
	} else {
		console.log(nw.whois(m[0]) + ' x ' + nw.whois(m[1]) + ' : ' + m[2])
	}
}

function initPreferenceLists() {
	for (var uid in nw.contacts) {
		if (nw.gender(uid)=='m') {
			if (nw.interest(uid)=='m') {
				MM.push(nw.contacts[uid])
			} else if (nw.interest(uid)=='f') {
				MF.push(nw.contacts[uid])
			}
		} else if (nw.gender(uid)=='f') {
			if (nw.interest(uid)=='m') {
				FM.push(nw.contacts[uid])
			} else if (nw.interest(uid)=='f') {
				FF.push(nw.contacts[uid])
			}
		}
	}
	console.log('(+) Initialized preference lists.')
}

function rankPartners(uid) {
	if (uid) {
		var partners = null
		var g1 = nw.gender(uid),
			i1 = nw.interest(uid)
		if (g1 == 'm') {
			if (i1 == 'm') {
				partners = MM
			} else if (i1 == 'f') {
				partners = FM
			}
		} else if (g1 == 'f') {
			if (i1 == 'm') {
				partners = MF
			} else if (i1 == 'f') {
				partners = FF
			}
		}
		var plist = partners.sort(function(a,b) {
			var scoreA = hScore(uid,a.id) + dScore(uid,a.id,false)
			var scoreB = hScore(uid,b.id) + dScore(uid,b.id,false)
			return scoreB-scoreA
		}).slice()
		return plist
	} else {
		return []
	}
}

function getProfileData(pid) {
	if (!(pid in nw.contacts)) {
		console.log('(-) Error: unknown id ' + pid);
		return null
	} else if (!(pid in matchData)) {
		return {up:[],down:[]}
	} else {
		var matches = matchData[pid],
			upList = [],
			downList = []
		for (var id in matches) {
			var match = matches[id]
			var skip = match.skip,
				up = match.up,
				down = match.down
			if (skip < up + down) {
				if (up >= down) {
					var k = 1000*(up-(0.5*down))+hScore(pid,id)
					upList.push([id,k])
				} else {
					var k = 1000*(down-(0.5*up))+hScore(pid,id)
					downList.push([id,k])
				}
			}
		}
		upList = upList.sort(function(a,b) {
			return b[1] - a[1]
		})
		downList = downList.sort(function(a,b) {
			return b[1] - a[1]
		})
		return {up:upList,down:downList}
	}
}