var exp = Math.exp,
	random = Math.random,
	min = Math.min,
	floor = Math.floor

function sigma(x) {
	return 1/(1+exp(-x))
}

function dot(u,v) {
	var k = min(u.length,v.length),
		res = 0
	for (var i = 0; i < k; i++) {
		res += (u[i]*v[i])
	}
	return res
}

function Neuron(inputsize) {
	this.weights = Array(inputsize)
	for (var i = 0; i < inputsize; i++) {
		this.weights[i] = random() - 0.5
	}
	this._out = null
	this.bias = random() - 0.5
}

Neuron.prototype.evaluate = function(inputs,save) {
	if (inputs.length !== this.weights.length) {
		throw 'Warning: Inputs must match weights.'
	} else {
		var out = sigma(this.bias + dot(this.weights,inputs))
		this._out = save ? out : null
		return out
	}
}

function NeuralNet(isize,hsize,alpha,eta) {
	alpha = alpha || 1.0
	eta = eta || 1.0
	hsize = hsize || floor(2*isize/3)
	this.alpha = alpha
	this.eta = eta
	this.hidden = Array(hsize)
	for (var i = 0; i < hsize; i++) {
		this.hidden[i] = new Neuron(isize)
	}
	this.output = new Neuron(hsize)
}

NeuralNet.prototype.evaluate = function(data,save) {
	var hvals = Array(this.hidden.length)
	for (var n = 0; n < hvals.length; n++) {
		hvals[n] = this.hidden[n].evaluate(data,save)
	}
	return this.output.evaluate(hvals,save)
}

NeuralNet.prototype.update = function(data,actual) {
	var alpha = this.alpha,
		eta = this.eta,
		hsize = this.hidden.length,
		pred = this.evaluate(data,true)
	// Compute deltas for output and hidden nodes
	var delK = pred*(1-pred)*(pred-actual)
	var delJ = Array(hsize)
	for (var n = 0; n < hsize; n++) {
		var outN = this.hidden[n]._out
		var wtN = this.output.weights[n]
		delJ[n] = outN*(1-outN)*delK*wtN
	}
	// Update output node bias
	this.output.bias = alpha*this.output.bias - eta*delK
	// Update output node weights
	for (var n = 0; n < hsize; n++) {
		var outN = this.hidden[n]._out
		this.output.weights[n] = alpha*this.output.weights[n] - eta*delK*outN
	}
	// Update hidden node biases
	for (var n = 0; n < hsize; n++) {
		var delta = delJ[n],
			hnode = this.hidden[n]
		hnode.bias = alpha*hnode.bias - eta*delta
		for (var m = 0; m < data.length; m++) {
			hnode.weights[m] = alpha*hnode.weights[m] - eta*delta*data[m]
		}
	}
}