
var mongo = require('mongodb');

ShiprProvider = function(host,port,app,app_port) {
	// var self = this
	// this.db = new Db('shipr',
	// 	new Server(host,port,{auto_reconnect: true}),{safe:true})
	// this.db.open(function() {
	// 	console.log('[+] Shipr successfully connected to MongoDB!')
	// 	console.log('[~] Deploying application...')
	//     app.listen(app_port,function() {
 //        	console.log('[+] Shipr is deployed on localhost:' + app.get('port'));
 //    	})
	// })
	this.db = null
	this = self
	console.log(' - MongoURI: ' + host)
	mongo.Db.connect(host, function(err,db) {
		if (err) {
			console.log('[-] Error connecting to Mongo: ' + err)
		}
		self.db = db
		console.log('[+] Shipr successfully connected to MongoDB!')
		console.log('[~] Deploying application...')
	    app.listen(app_port,function() {
        	console.log('[+] Shipr is deployed on port ' + app.get('port'));
    	})
	})
}

ShiprProvider.prototype.getMatches = function(callback) {
	this.db.collection('matches',function(err,matches) {
		if (err) {
			console.log('  [-] Error finding matches.')
			callback(err)
		} else {
			callback(null,matches)
		}
	})
}

ShiprProvider.prototype.getCache = function(callback) {
	this.db.collection('cache',function(err,matches) {
		if (err) {
			console.log('  [-] Error finding cached data.')
			callback(err)
		} else {
			callback(null,matches)
		}
	})
}

ShiprProvider.prototype.findNetwork = function(uid,callback) {
	this.getCache(function(err,cache) {
		if (err) {
			console.log('  [-] Error when finding network for ' + uid)
		} else {
			cache.findOne({root:uid},function(err,res) {
				if (err) {
					console.log('  [-] Error when updating network for ' + uid)
					callback(err)
				} else {
					if (res) {
						console.log('  [+] Successfully retrieved network ' + uid + ' (' + res.time + ')')
						callback(null,res)
					} else {
						console.log('  [+] No network found for ' + uid)
						callback(null,null)
					}
				}
			})
		}
	})
}

ShiprProvider.prototype.writeNetwork = function(nw,callback) {
	this.getCache(function(err,cache) {
		if (err) {
			console.log('  [-] Error when updating network for ' + nw.root)
		} else {
			cache.update({root:nw.root},{$set:{root:nw.root,time:nw.time,adj:nw.adj}},{upsert:true},function(err,res) {
				if (err) {
					console.log('  [-] Error when updating network for ' + nw.root)
					callback(err)
				} else {
					console.log('  [+] Successfully wrote network ' + nw.root + ' (' + nw.time + ')')
					callback(null,nw.time)
				}
			})
		}
	})
}

ShiprProvider.prototype.findMatchesByIds = function(idlist,callback) {
	this.getMatches(function(err,matches) {
		matches.find({$and:[{a:{$in:idlist}},{b:{$in:idlist}}]}).toArray(function(err,res) {
			if (err) {
				console.log('  [-] Error when reading matches from list.')
				callback(err)
			} else {
				callback(null,res)
			}
		})
	})
}

ShiprProvider.prototype.findMatchesById = function(id1,id2,callback) {
	// The second ID will should be greater than the first
	if (parseInt(id1) > parseInt(id2)) {
		var tmp = id1
		id1 = id2
		id2 = tmp
	}
	if (id2 == null) {
		this.getMatches(function(err,matches) {
			matches.find({$or:[{a:id1},{b:id1}]}).toArray(function(err,res) {
				if (err) {
					console.log('  [-] Error when reading match(' + id1 + ', * )')
					callback(err)
				} else {
					callback(null,res)
				}
			})
		})
	} else {
		this.getMatches(function(err,matches) {
			matches.findOne({a:id1,b:id2},function(err,res) {
				if (err) {
					console.log('  [-] Error when reading match(' + id1 + ', * )')
					callback(err)
				} else {
					callback(null,res)
				}
			})
		})
	}
}

ShiprProvider.prototype.updateMatchById = function(uid,id1,id2,r,callback) {
	// The second ID will should be greater than the first
	if (parseInt(id1) > parseInt(id2)) {
		var tmp = id1
		id1 = id2
		id2 = tmp
	}
	var info = {
		a:id1,
		b:id2,
		up:0,
		down:0,
		skip:0
	}
	info[r] = 1

	this.getMatches(function(err,matches) {
		matches.findOne({a:id1,b:id2},function(err,res) {
			if (err) {
				console.log('  [-] Error when finding match(' + id1 + ',' + id2 + ',' + r + ')')
				callback(err)
			} else {
				// No entry found...
				if (!res || Object.keys(res).length < 5) {
					info.voted = {}
					info.voted[uid] = r
					var msg = 'Voted new pair: (' + id1 + ',' + id2 + ',' + r + ')'
					updateEntry(matches,callback,info,id1,id2,r,msg)

				// uid is not present...
				} else if (!(uid in res.voted)) {
					res.voted[uid] = r
					info.up += res.up
					info.down += res.down
					info.skip += res.skip
					info.voted = res.voted
					info._id = res._id
					var msg = 'Vote casted: (' + id1 + ',' + id2 + ',' + r + ')'
					updateEntry(matches,callback,info,id1,id2,r,msg)

				// uid is present...
				} else {
					var prevr = res.voted[uid]
					if (r != prevr) {
						info[prevr] = -1
						res.voted[uid] = r
						info.up += res.up
						info.down += res.down
						info.skip += res.skip
						info.voted = res.voted
						info._id = res._id
						var msg = 'Vote updated: (' + id1 + ',' + id2 + ',' + r + ')'
						updateEntry(matches,callback,info,id1,id2,r,msg)
					} else {
						callback(null,'No change.')
					}
				}
			}
		})
	})
}

function updateEntry(matches,callback,info,id1,id2,r,message) {
	matches.save(info,function(err,res) {
		if (err) {
			console.log('  [-] Error when updating match(' + id1 + ',' + id2 + ') with ' + r)
			callback(err)
		} else {
			callback(null,message)
			console.log('  [+] ' + message)
		}
	})
}

exports.ShiprProvider = ShiprProvider