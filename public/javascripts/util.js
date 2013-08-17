
min = Math.min
abs = Math.abs
max = Math.max
sqrt = Math.sqrt
pow = Math.pow
random = Math.random
floor = Math.floor
round = Math.round
/**
    Binary Heap implementation
    source: https://gist.github.com/dburger/1008320
*/
var BinaryHeap = function(comp) {
    comp = comp || function(a, b) {return a > b;};var arr = [];
    var swap = function(a, b) {var temp = arr[a];arr[a] = arr[b];arr[b] = temp;};
    var bubbleDown = function(pos) {var left = 2 * pos + 1;var right = left + 1;
        var largest = pos;
        if (left < arr.length && comp(arr[left], arr[largest])) {largest = left;}
        if (right < arr.length && comp(arr[right], arr[largest])) {largest = right;}
        if (largest != pos) {swap(largest, pos);bubbleDown(largest);}};
    var bubbleUp = function(pos) {if (pos <= 0) {return;}
        var parent = Math.floor((pos - 1) / 2);
        if (comp(arr[pos], arr[parent])) {swap(pos, parent);bubbleUp(parent);}};
    var that = {};
    that.pop = function() {
        if (arr.length === 0) {throw new Error("pop() called on empty binary heap");}
        var value = arr[0];var last = arr.length - 1;arr[0] = arr[last];arr.length = last;
        if (last > 0) {bubbleDown(0);}return value;};
    that.push = function(value) {arr.push(value);bubbleUp(arr.length - 1);};
    that.size = function() {return arr.length;};return that;
};

Array.zeros = function(numrows,numcolumns) {
    var A = []
    numcolumns = numcolumns || 1
    for (var r = 0; r < numrows; r++) {
        var a = []
        for (var c = 0; c < numcolumns; c++) {
            a.push(0)
        }
        A.push(a)
    }
    A.rowcount = numrows
    A.colcount = numcolumns
    return A
}

Array.prototype.clone = function() {
    return this.slice(0)
}

Array.prototype.invmap = function() {
    var m = {}, k = 0
    this.forEach(function(elem) {
        m[elem] = k
        k++
    })
    return m
}

Array.prototype.remove = function(item) {
    return this.splice(this.indexOf(item),1)
}

Array.prototype.sgn = function() {
    var v = Array(this.length)
    for (var k = 0; k < this.length; k++) {
        if (this[k] > 0) {
            v[k] = 1
        } else {
            v[k] = -1
        }
    }
    return v
}

Array.prototype.random = function() {
    return this[floor(this.length*random())]
}

function flatten(ctree) {
    if (ctree.branch) {
        return flatten(ctree[0]).concat(flatten(ctree[1]))
    } else {
        return [ctree]
    }
}

// a = Array.zeros(2,2);
// a.setsymm(0,0,7);
// a.setsymm(1,1,-7);
// a.setsymm(0,1,2);
// e = a.realeig