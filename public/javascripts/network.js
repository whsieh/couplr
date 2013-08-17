// Actual scraper begins here

var TYPES = {
    0:'unknown',
    1:'friend',
    2:'link',
    3:'photo',
    4:'video',
    5:'invitation'
}

var postData = {}
var PRIME = 1234567891
var nw = null
var pastData = null
var ATOKEN = null
var progress = null
var YEAR_REGEXP = /\d\d\d\d/
var CUR_YEAR = 2013
/**
    Converts a FB response to data Object directly relevant to Shipr
*/
function toPostData(resp) {
    var posts = resp.data
    var size = Object.keys(postData).length
    posts.forEach(function(post) {
        data = extractDataFromPost(post)
        if (data.type != 0) {
            data.uid = id
            k = hashPostData(data)
            if (k in postData) {
                if (postData[k].uid==id) {
                    postData[k].count++
                }
            } else {
                postData[k] = data
            }
        }
    })
    console.log((Object.keys(postData).length - size) + ' datapoints added.')
}

/**
    Reads the stream (aka Facebook feed) of the user corresponding to the
    given id with additional argument limit=lim. Executes the callback function
    after response is received
*/
function readStream(id,lim,callback) {
    callback = (callback==undefined?toPostData:callback)
    FB.api(id+'/feed?limit='+lim,callback)
}

/**
    Attempts to map a Shipr data Object to a unique integer.
*/
function hashPostData(data) {
    hash = 0, k = 1
    if (data.from != undefined) {
        hash += k*parseInt(data.from)
        k += 1
    }
    hash = hash % PRIME
    if (data.to != undefined) {
        data.to.forEach(function(m){
            hash += k*parseInt(m)
            k += 1
        })
    }
    hash = hash % PRIME
    if (data.likes != undefined) {
        data.likes.forEach(function(m){
            hash += k*parseInt(m)
            k += 1
        })
    }
    hash = hash % PRIME
    if (data.comments != undefined) {
        data.comments.forEach(function(m){
            hash += k*parseInt(m.id)
            hash += k*m.text.length
            k += 1
        })
    }
    hash = hash % PRIME
    if (data.message != undefined) {
        var a=1,b=1
        for (var i = 0; i < data.message.length; i++) {
            b = a
            a = data.message.charCodeAt(i)
            hash += a*b
        }
    }
    hash = hash % PRIME
    hash = Math.pow(hash,data.type) % PRIME
    return hash
}

/**
    Given raw Facebook post data, extracts information Shipr will need in
    the form of a data Object
*/
function extractDataFromPost(post) {
    var story = post.story!=undefined?post.story:''
    var type = post.type
    var data = null
    if (post.application != undefined && post.application.name == 'Pages') {
        return {type:0}
    }
    if (story.indexOf(' was invited to ')!=-1) {
        data = {type:5}
        data.from = post.from.id
        data.to = []
        for (k in post.story_tags) {
            if (post.story_tags[k][0].id != data.from) {
                data.to.push(post.story_tags[k][0].id)
            }
        }
        var a = post.story.indexOf(' invited to ') + 12
        var b = post.story.lastIndexOf('by')
        data.group = post.story.substring(a,b).trim()

    } else if (post.status_type=='approved_friend') {
        data = {type:1}
        data.to = []
        for (k in post.story_tags) {
            if (k == 0) {
                data.from = post.story_tags[0][0].id
            } else {
                data.to.push(post.story_tags[k][0].id)
            }
        }

    } else if (type=='link' && story.indexOf(' went to an event.')==-1) {
        data = {type:2}
        data.caption = post.caption
        data.link = post.link
        data.from = post.from.id
        data.to = []
        if (post.to != undefined) {
            post.to.data.forEach(function(e) {
                data.to.push(e.id)
            })
        }
        data.message = post.message==undefined?"":post.message
        var tmp = []
        for (k in post.message_tags) {
            tmp.push([post.message_tags[k][0].offset,
                post.message_tags[k][0].length])
        }
        for (var i = tmp.length-1; i >= 0; i--) {
            data.message = data.message.slice(0,tmp[i][0]) + 
            data.message.slice(tmp[i][0]+tmp[i][1]+1,data.message.length)
        }

    } else if (type=='photo') {
        data = {type:3}
        data.from = post.from.id
        data.to = []
        if (post.to != undefined) {
            post.to.data.forEach(function(e) {
                data.to.push(e.id)
            })
        }
        data.message = post.message==undefined?"":post.message
        var tmp = []
        for (k in post.message_tags) {
            tmp.push([post.message_tags[k][0].offset,
                post.message_tags[k][0].length])
        }
        for (var i = tmp.length-1; i >= 0; i--) {
            data.message = data.message.slice(0,tmp[i][0]) + 
            data.message.slice(tmp[i][0]+tmp[i][1]+1,data.message.length)
        }

    } else if (type=='video') {
        data = {type:4}
        data.caption = post.caption
        data.link = post.link
        data.from = post.from.id
        data.to = []
        if (post.to != undefined) {
            post.to.data.forEach(function(e) {
                data.to.push(e.id)
            })
        }
        data.message = post.message==undefined?'':post.message
        var tmp = []
        for (k in post.message_tags) {
            tmp.push([post.message_tags[k][0].offset,
                post.message_tags[k][0].length])
        }
        for (var i = tmp.length-1; i >= 0; i--) {
            data.message = data.message.slice(0,tmp[i][0]) + 
            data.message.slice(tmp[i][0]+tmp[i][1]+1,data.message.length)
        }

    } else {
        return {type:0}
    }
    data.comments = []
    data.likes = []
    if (post.comments != undefined) {
        post.comments.data.forEach(function(cmt) {
            data.comments.push({'id':cmt.from.id,'text':cmt.message})
        })
    }
    if (post.likes != undefined) {
        post.likes.data.forEach(function(like) {
            data.likes.push(like.id)
        })
    }
    data.count = 1
    return data
}

/**
    Combines two Facebook IDs in a unique way (passing in i,j and
    j,i will result in the same string)
*/
function combineID(id1, id2) {
    if (id1 == id2) {
        return null
    }else if (parseInt(id1) < parseInt(id2)) {
        return id1 + '.' + id2
    }
    return id2 + '.' + id1
}

/**
    Splits a string into two Facebook IDs
*/
function splitID(ids) {
    var i = ids.indexOf('.')
    return [ids.substring(0,i),ids.substring(i+1,ids.length)]
}

/**
    The main graph data structure used by Shipr to store the user's
    immediate social network
*/
function Network(rootID,contacts) {
    this.rootID = rootID
    this.contacts = contacts
    this.posts = {}
    this.vcount = 0
    this.ecount = 0
    this.wcount = 0
    this.vlist = []
    this.pruned = false
    this.weightedDists = {}
    this.unweightedDists = {}
}

/**
    Given a list or Facebook ID as a string or integer, returns the
    name of the corresponding user
*/
Network.prototype.whois = function(id) {
    var self = this
    if (typeof(id)=='object') {
        var self = this
        var ls = []
        id.forEach(function(i) {
            ls.push(self.whois(i))
        })
        return ls
    } else {
        if (typeof(id)=='number') {
            id = parseInt(id)
        }
        if (id in this.contacts) {
            return this.contacts[id].name
        } else {
            return '(?)'
        }
    }
}

Network.prototype.picture = function(id) {
    var self = this
    if (typeof(id)=='object') {
        var self = this
        var ls = []
        id.forEach(function(i) {
            ls.push(self.picture(i))
        })
        return ls
    } else {
        if(typeof(id)=='number') {
            id = parseInt(id)
        }
        if(id in this.contacts) {
            return this.contacts[id].picture.data.url
        } else {
            return 'no picture'
        }
    }
}

Network.prototype.gender = function(id) {
    var self = this
    if (typeof(id)=='object') {
        var self = this
        var ls = []
        id.forEach(function(i) {
            ls.push(self.gender(i))
        })
        return ls
    } else {
        if(typeof(id)=='number') {
            id = parseInt(id)
        }
        if(id in this.contacts) {
            return this.contacts[id].gender
        } else {
            return 'gender...'
        }
    }
}

Network.prototype.interest = function(id) {
    var self = this
    if (typeof(id)=='object') {
        var self = this
        var ls = []
        id.forEach(function(i) {
            ls.push(self.interest(i))
        })
        return ls
    } else {
        if(typeof(id)=='number') {
            id = parseInt(id)
        }
        if(id in this.contacts) {
            return this.contacts[id].interest
        } else {
            return 'interest...'
        }
    }
}

/**
    Updates the Network given edge, a string in the form
    "A.B", where A represents the ID of one user and B
    represents the ID of the other. Note that the edge
    added is assumed to be undirected (i.e. two directed
    edges will be added)
    If the ID is has not yet appeared in the Network, search
    the user's contacts for the ID. If a match is found, add the
    user to the graph. Otherwise, log a warning in the console
    and return.
*/
  Network.prototype._addLink = function(edge,weight) {
    var ids = splitID(edge)
    // console.log(ids.toString() + ' -> ' + weight)
    var a = ids[0], b = ids[1]
    if (!(a in this.contacts && b in this.contacts)) {
        return null
    }
    var newVertices = []
    if (!(a in this)) {
        this._addVertex(a)
        newVertices.push(a)
    }
    if (b in this[a]) {
        this[a][b] += weight
        this.wcount += weight
    } else {
        this[a][b] = weight
        this.ecount += 1
        this.wcount += weight
    }
    if (!(b in this)) {
        this._addVertex(b)
        newVertices.push(b)
    }
    if (a in this[b]) {
        this[b][a] += weight
        this.wcount += weight
    } else {
        this[b][a] = weight
        this.ecount += 1
        this.wcount += weight
    }
    return newVertices
}

Network.prototype._addVertex = function(vertex) {
    this[vertex] = {}
    this.vcount += 1
    this.vlist.push(vertex)
}

Network.prototype._removeLink = function(v1,v2) {
    if (v1 in this[v2]) {
        var w = this[v2][v1]
        delete this[v2][v1]
        delete this[v1][v2]
        this.ecount -= 2
        this.wcount -= 2*w
    }
}

Network.prototype._removeVertex = function(vtx) {
    if (vtx in this) {
        for (dst in this[vtx]) {
            this._removeLink(vtx,dst)
        }
        delete this[vtx]
        this.vcount -= 1
        this.vlist.splice(this.vlist.indexOf(vtx),1)
    }
}

/**
    Given id, an id representing the Facebook ID number of a friend of the
    user, reads the friend's stream up to the given limit lim, extracting
    potential social connections (i.e. edges) from the post data. Uses the
    edge data to update the underlying graph model of the Network.
*/
  Network.prototype.scrape = function(id,lim,callback) {
    // If the limit is undefined, set it to a 'default' of 200
    lim = (lim==undefined?200:lim)
    // Bind network to preserve scope of 'this' within callback
    var self = this
    // Read id's stream
    readStream(id,lim,function(r) {
        // The raw data, a list of Facebook posts
        var pList = r.data
        if (pList != undefined) {
            // An object to keep track of new posts encountered
            var newData = {}
            // For each post...
            pList.forEach(function(pList) {
                // Extract relevant data from the post
                var data = extractDataFromPost(pList)
                // If the post is deemed relevant...
                if (data.type != 0) {
                    // Set user id of this data as the current id
                    // We will need this when we check to see if
                    // this post is redundant
                    data.uid = id
                    // Map the data to a (hopefully) unique integer
                    var k = hashPostData(data)
                    // If the post is already observed...
                    if (k in self.posts) {
                        // ...if this post appears twice in the same query
                        if (self.posts[k].uid==id) {
                            // ...count it as a repeat
                            self.posts[k].count++
                            newData[k].count++
                        }
                        // If the post was observed under another id, it is
                        // redundant information and we ignore it
                    } else {
                        // ...if the post is new, add it to known posts
                        self.posts[k] = data
                        newData[k] = data
                    }
                }
            })
            // An object to keep track of new edges to add to our Network
            var newEdges = {}
            this.newVertices = []
            // Add new edge info using our recently queried data
            for (k in newData) {
                newEdges = Network.extractEdges(newData[k],newEdges)
            }
            // Add the new edges to this Network
            for (k in newEdges) {
                newVertices = newVertices.concat(self._addLink(k,newEdges[k]))
            }
            console.log('(+) Scraped wall feed of ' + self.contacts[id].name + 
                ' and found ' + Object.keys(newEdges).length + ' connections.')
            if (callback != undefined) {
                callback()
            }
        }
    })
}

Network.prototype.build = function (maxIter,lim,callback) {
    var self = this
    maxIter = (maxIter || 25)
    lim = (lim || 100)
    var me = self.rootID
    var query = Object.keys(self[me]).sort(function(a,b) {
        return self[me][b] - self[me][a]
    })
    progress = 0
    var qcount = min(maxIter,query.length)    
    for (var i = 0; i < qcount; i++) {
        self.scrape(query[i],lim,function() {
            progress += 1
            setProgress(floor(100*progress/qcount),$('#progress-bar'))
            if (progress == qcount) {
                setTimeout(function() {
                    if (callback != undefined) {
                        callback()
                    }
                    console.log('(+) Shipr is ready!')
                },500)
            }
        })
    }
}

Network.prototype.prune = function() {
    if (!this.pruned) {
        var fringe = [], prunecount = 0
        var self = this
        this.vlist.forEach(function(vtx) {
            if (Object.keys(self[vtx]).length < 2) {
                fringe.push(vtx)
            }
        })
        while (fringe.length > 0) {
            fringe.forEach(function(vtx) {
                self._removeVertex(vtx)
                prunecount++
            })
            fringe = []
            this.vlist.forEach(function(vtx) {
                if (Object.keys(self[vtx]).length < 2) {
                    fringe.push(vtx)
                }
            })
        }
        console.log('(+) Pruned ' + prunecount + ' vertices.')
        this.pruned = true
    }
}

Network.prototype.toString = function() {
    var self = this
    s = 'Root: '
    s += self.contacts[self.rootID].name + '\n'
    s += self.vcount + ' vertices; ' + self.ecount + ' edges\n'
    self.vlist.forEach(function(vs) {
        s += ' * ' + self.contacts[vs].name + ':\n'
        for (vd in self[vs]) {
            s += '   - ' + self.contacts[vd].name + ',' + self[vs][vd] + '\n'
        }
    })
    return s
}

Network.prototype.degree = function(vtx) {
    return Object.keys(this[vtx]).length
}

Network.prototype.wdegree = function(vtx,vset) {
    var t = 0
    if (vset == undefined) {
        for (v in this[vtx]) {
            t += this[vtx][v]
        }
        return t
    } else {
        for (v in this[vtx]) {
            if (v in vset) {
                t += this[vtx][v]
            }
        }
        return t
    }
}

Network.prototype.getWCount = function(vlist) {
    if (vlist == undefined) {
        return this.wcount
    } else {
        var vset = vlist.invmap()
        var self = this, total = 0
        vlist.forEach(function(v) {
            total += self.wdegree(v,vset)
        })
        return total
    }
}

Network.prototype.bfsdist = function(id1,id2) {
    var udists = this.unweightedDists
    if (id1 in udists) {
        if (id2 in udists[id1]) {
            return udists[id1][id2]
        } else {
            return Infinity
        }
    } else if (id2 in udists) {
        if (id1 in udists[id2]) {
            return udists[id2][id1]
        } else {
            return Infinity
        }
    } else {
        var distmap = this._bfsDist(id1)
        udists[id1] = distmap
        if (id2 in distmap) {
            return distmap[id2]
        } else {
            return Infinity
        }
    }
}

Network.prototype.invdist = function(id1,id2) {
    var udists = this.weightedDists
    if (id1 in udists) {
        if (id2 in udists[id1]) {
            return udists[id1][id2]
        } else {
            return Infinity
        }
    } else if (id2 in udists) {
        if (id1 in udists[id2]) {
            return udists[id2][id1]
        } else {
            return Infinity
        }
    } else {
        var distmap = this._dijkstraDist(id1)
        udists[id1] = distmap
        if (id2 in distmap) {
            return distmap[id2]
        } else {
            return Infinity
        }
    }
}

/**
    Important: does NOT consider the root ID.
*/
Network.prototype.shortestPaths = function(vtx,weighted) {
    var result = null
    if (weighted) {
        if (vtx in this.weightedDists) {
            result = this.weightedDists[vtx]
        } else {
            result = this._dijkstraDist(vtx)
            this.weightedDists[vtx] = result
        }
    } else {
        if (vtx in this.unweightedDists) {
            result = this.unweightedDists[vtx]
        } else {
            result = this._bfsDist(vtx)
            this.unweightedDists[vtx] = result
        }
    }
    return result
}

Network.prototype._dijkstraDist = function(vtx) { 
    var self = this
    var dists = {}
    var frontier = new BinaryHeap(function(a,b){return b[1]>a[1]}) 
    frontier.push([vtx,0]) 
    while (frontier.size() > 0) {
        var first = frontier.pop() 
        var fVtx=first[0], fDst=first[1]
        if (!(fVtx in dists)) {
            dists[fVtx] = fDst 
            for (var vn in self[fVtx]) {
                if (!(vn in dists) && (vn!=nw.rootID)) { 
                    var d = fDst + (1.0/self[fVtx][vn]) 
                    frontier.push([vn,d]) 
                } 
            } 
        } 
    } 
    return dists 
}

Network.prototype._bfsDist = function(vtx) {
    var self = this
    var dists = {}
    var frontier = [[vtx,0]]
    while (frontier.length > 0) {
        var first = frontier.shift()
        var fVtx = first[0], fDst = first[1]
        dists[fVtx] = fDst
        var neighbors = Object.keys(self[fVtx])
        neighbors.forEach(function(v) {
            if (!(v in dists) && (v!=nw.rootID)) {
                dists[v] = fDst+1
                frontier.push([v,fDst+1])
            }
        })
    }
    return dists
}

Network.prototype.bfsPartition = function(vlist) {
    var self = this
    self.prune()
    vlist = vlist || self.vlist
    var vset = vlist.invmap()
    var explored = {}, total = 0, partitions = []
    var curpart = [], frontier = []
    while (total < vlist.length) {
        var newRoot = null
        for (var i = 0; i < vlist.length; i++) {
            if (!(vlist[i] in explored)) {
                newRoot = vlist[i]
                break
            }
        }
        frontier.push(newRoot)
        explored[newRoot] = true
        while (frontier.length > 0) {
            var vtx = frontier.shift()
            curpart.push(vtx)
            total++
            var neighbors = Object.keys(self[vtx])
            neighbors.forEach(function(vn) {
                if (vn in vset && !(vn in explored)) {
                    explored[vn] = true
                    frontier.push(vn)
                }
            })
        }
        partitions.push(curpart)
        curpart = []
        frontier = []
    }
    return partitions
}

Network.prototype.serialize = function() {
    var data = {}
    data.time = round(new Date().getTime()/1000)
    data.root = this.rootID
    data.adj = {}
    for (var i = 0; i < this.vlist.length; i++) {
        var vtx = this.vlist[i]
        data.adj[vtx] = $.extend(true,{},this[vtx])
    }
    return data
}

Network.extractEdges = function(data,edges) {
    edges = edges==undefined?{}:edges
    if (data.from != undefined && data.to != undefined) {
        data.to.forEach(function(id) {
            var key = combineID(data.from,id)
            if (key != null) {
                if (key in edges) {
                    edges[key] += data.count
                } else {
                    edges[key] = data.count
                }
            }
        })
    }
    if (data.comments != undefined) {
        var com = data.comments
        var prev = null
        for (var i = 0; i < com.length; i++) {
            var key = combineID(com[i].id,data.from)
            if (key != null) {
                if (key in edges) {
                    edges[key] += data.count
                } else {
                    edges[key] = data.count
                }
            }
            if (prev != null) {
                key = combineID(com[i].id,prev)
                if (key != null) {
                    if (key in edges) {
                        edges[key] += 2*data.count
                    } else {
                        edges[key] = 2*data.count
                    }
                }
            }
            prev = com[i].id
        }
    }
    if (data.likes != undefined) {
        data.likes.forEach(function(id) {
            var key = combineID(data.from,id)
            if (key != null) {
                if (key in edges) {
                    edges[key] += 2*data.count
                } else {
                    edges[key] = 2*data.count
                }
            }
        })
    }
    return edges
}

function initFromStream() {
    nw.scrape(nw.rootID,200,function() {
        nw.build(40,150,function(){
            writeNetwork()
            usePreMatches = false
            loadMatches(500)
            setInterval(loadContinuousMatches,1000)
        })
    })
}

function initFromCache(data) {
    setProgress(100,$('#progress-bar'),500)
    var edges = {}
    for (var id1 in data.adj) {
        for (var id2 in data.adj[id1]) {
            edges[combineID(id1,id2)] = data.adj[id1][id2]
        }
    }
    for (var idkey in edges) {
        nw._addLink(idkey,edges[idkey])
    }
}

function initRootNetwork() {
    contacts = {}
    if (typeof(FB) != 'undefined') {
        ATOKEN = FB.getAccessToken()
        // <1> Scrape friends' data
        FB.api('me/friends?fields=gender,id,name,interested_in,birthday,picture.height(100).width(100)', function(r) {
            if (r.data != undefined) {
                r.data.forEach(function(d) {
                    var info = {
                        'name':d.name,
                        'gender':d.gender,
                        'interest':d.interested_in,
                        'id':d.id,
                        'picture':d.picture,
                        'age':d.birthday
                    }
                    if (info.gender == undefined) {
                        // ? indeed...
                        info.gender = '?'
                    } else {
                        info.gender = info.gender.substring(0,1)
                    }
                    if (info.interest == undefined) {
                        // Political correctness aside, I will assume you are straight
                        info.interest = (info.gender=='m')?'f':'m'
                    } else {
                        info.interest = info.interest[0].substring(0,1)
                        if (info.interest.length > 1) {
                            info.interest += info.interest[1].substring(0,1)
                        }
                    }
                    if (info.age == undefined) {
                        info.age = null
                    } else {
                        var i = info.age.search(YEAR_REGEXP)
                        if (i == -1) {
                            info.age = null
                        } else {
                            var b = parseInt(info.age.substring(i,i+4))
                            info.age = CUR_YEAR - b
                        }
                    }
                    contacts[d.id] = info
                })
                // <2> Scrape personal data
                FB.api('me?fields=gender,id,name,interested_in,birthday,picture.height(80).width(80)',function(m) {
                    var info = {
                        'name':m.name,
                        'gender':m.gender,
                        'interest':m.interested_in,
                        'id':m.id,
                        'picture':m.picture,
                        'age':m.birthday
                    }
                    if (info.gender == undefined) {
                        // ? indeed...
                        info.gender = '?'
                    } else {
                        info.gender = info.gender.substring(0,1)
                    }
                    if (info.interest == undefined) {
                        // Political correctness aside, I will assume you are straight
                        info.interest = (info.gender=='m')?'f':'m'
                    } else {
                        info.interest = info.interest[0].substring(0,1)
                        if (info.interest.length > 1) {
                            info.interest += info.interest[1].substring(0,1)
                        }
                    }
                    if (info.age == undefined) {
                        info.age = null
                    } else {
                        var i = info.age.search(YEAR_REGEXP)
                        if (i == -1) {
                            info.age = null
                        } else {
                            var b = parseInt(info.age.substring(i,i+4))
                            info.age = CUR_YEAR - b
                        }
                    }
                    contacts[m.id] = info
                    // <3> Initialize the network object
                    nw = new Network(m.id,contacts)
                    console.log('(+) Root network initialized.')
                    // Build MM,MF,FM,FF
                    initPreferenceLists()
                    // <4> Get friends' match information
                    queryInitMatches()
                })
            } else {
                console.log('Facebook API not ready yet. Retrying in 500 ms...')
                setTimeout(function() {
                    initRootNetwork()
                },500)
            }
        })
    } else {
        console.log('Facebook API not ready yet. Retrying in 500 ms...')
        setTimeout(function() {
            initRootNetwork()
        },500)
    }
}
