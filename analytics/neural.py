
from graph import *
from math import exp
from random import random,choice,shuffle
from json import JSONEncoder,load as loadJSON
from numpy.random import choice as npchoice

decay,initial = 0.995,0.75
calc_eta = lambda t : initial*pow(decay,t)
sigma = lambda x : 1.0/(1.0+exp(-x))

class Neuron:

	def __init__(self,inputNodes):
		self.inputs = []
		self.weights = []
		for node in inputNodes:
			self.inputs.append(node)
			self.weights.append(random()-0.5)
		self.bias = random()-0.5
		self._prev = None

	def evaluate(self,v1,v2,updatePrev=False):
		x = self.bias
		for k,node in enumerate(self.inputs):
			x += self.weights[k]*node.evaluate(v1,v2,updatePrev)
		res = sigma(x)
		if updatePrev:
			self._prev = res
		return res

class Sensor(Neuron):

	def __init__(self,func):
		self.func = func
		self._prev = None

	def evaluate(self,v1,v2,updatePrev=False):
		res = self.func(v1,v2)
		if updatePrev:
			self._prev = res
		return res

"""
Basic single-output neural network with 1 input and 1 hidden layer.
Uses back-propagation to correct weights and biases.
"""
class NeuralNet:

	def __init__(self,features,hiddencount=6):
		self.sensors = []
		for func in features:
			self.sensors.append(Sensor(func))
		self.hidden = []
		for i in range(hiddencount):
			self.hidden.append(Neuron(self.sensors))
		self.output = Neuron(self.hidden)

	def predict(self,v1,v2):
		return self.output.evaluate(v1,v2)

	def update(self,v1,v2,actual,t=0):
		pred = self.output.evaluate(v1,v2,True)
		delK = pred*(1-pred)*(pred-actual)
		delJ = [0]*len(self.hidden)
		for i,hnode in enumerate(self.hidden):
			s = hnode._prev*(1-hnode._prev)
			t = delK*self.output.weights[i]
			delJ[i] = s*t
		eta = calc_eta(t)
		# Update the output and its connections to the hidden layer
		dTheta = -eta*delK
		self.output.bias += dTheta
		for j in range(len(self.output.weights)):
			dW = dTheta*self.output.inputs[j]._prev
			self.output.weights[j] += dW
		# Update each hidden node and its connections to the sensors
		for j,hnode in enumerate(self.hidden):
			dTheta = -eta*delJ[j]
			hnode.bias += dTheta
			for i in range(len(hnode.inputs)):
				dW = dTheta*hnode.inputs[i]._prev
				hnode.weights[i] += dW

	def train(self,trials=20,repeat=100):
			males = []
			females = []
			for uid in G.vertices():
				if uid != G.root:
					gender = C[uid]['gender']
					if gender == 'm':
						males.append(uid)
					elif gender == 'f':
						females.append(uid)
			history = []
			while trials > 0:
				print '~ Trials remaining: ' + str(trials)
				m,f = choice(males),choice(females)
				mstr,fstr = str(whois(m)),str(whois(f))
				printFeatureVector(m,f)
				print '  - Prior prediction: ' + str(self.predict(m,f))
				n = int(raw_input('  - ' + mstr + ' x ' + fstr + ': '))
				for _ in range(repeat):
					self.update(m,f,n)
				print '  - Updated prediction: ' + str(self.predict(m,f))
				history.append((m,f))
				trials -= 1
			print '~ FINAL EVALUATIONS...'
			for m,f in history:
				mstr,fstr = str(whois(m)),str(whois(f))
				print '  - ' + mstr + ' x ' + fstr + ' = ' + str(self.predict(m,f))

	def trainset(self,fname,tportion=0.25,epochs=50):
		if 'datasets/' not in fname:
			fname = 'datasets/' + fname
		if '.json' not in fname:
			fname = fname + '.json'
		f = open(fname)
		mlist = loadJSON(f)
		f.close()
		tportion = int(len(mlist)*max(0,min(1.0,tportion)))
		for k in range(epochs):
			print 'Training: epoch #' + str(k)
			for match in npchoice(mlist,tportion,replace=False):
				a,b = match['a'],match['b']
				self.update(a,b,match['val'])

	def save(self,fname='NN-00'):
		if 'datasets/' not in fname:
			fname = 'datasets/' + fname
		if '.json' not in fname:
			fname = fname + '.json'
		data = {}
		for i,hnode in enumerate(self.hidden):
			hweights = []
			for wj in hnode.weights:
				hweights.append(wj)
			data['h'+str(i)] = {'bias':hnode.bias,'weights':hweights}
		data['out'] = {'bias':self.output.bias,'weights':self.output.weights}
		data['hsize'] = len(self.hidden)
		fout = open(fname,'w')
		fout.write(JSONEncoder().encode(data))
		fout.close()
		return data

	@staticmethod
	def load(fname='NN-00',features=FTVEC):
		if 'datasets/' not in fname:
			fname = 'datasets/' + fname
		if '.json' not in fname:
			fname = fname + '.json'
		f = open(fname)
		data = loadJSON(f)
		f.close()
		NN = NeuralNet(features,hiddencount=data['hsize'])
		for i,hnode in enumerate(NN.hidden):
			hinfo = data['h'+str(i)]
			hnode.bias = hinfo['bias']
			hnode.weights = hinfo['weights']
		NN.output.bias = data['out']['bias']
		NN.output.weights = data['out']['weights']
		return NN

NN = NeuralNet(FTVEC)
# v1,v2 = G.vertices()[22],G.vertices()[25]

def testPredictions(NN,trials=1):
	males = []
	females = []
	for uid in G.vertices():
		if uid != G.root:
			gender = C[uid]['gender']
			if gender == 'm':
				males.append(uid)
			elif gender == 'f':
				females.append(uid)
	while trials > 0:
		m,f = choice(males),choice(females)
		mstr,fstr = str(whois(m)),str(whois(f))
		# printFeatureVector(m,f)
		print '~ ' + mstr + ' x ' + fstr + ': '
		print '  * Prediction: ' + str(NN.predict(m,f))
		trials -= 1

def writeTrainingData():
	males = []
	females = []
	training = []
	for uid in G.vertices():
		if uid != G.root:
			gender = C[uid]['gender']
			if gender == 'm':
				males.append(uid)
			elif gender == 'f':
				females.append(uid)
	print '~ FEMALES:'
	for f in females:
		print '  - ' + f + ' -> ' + whois(f)
	print '~ MALES:'
	for m in males:
		print '  - ' + m + ' -> ' + whois(m)
	for f in females:
		print '~ Extract pairs for ' + whois(f) + '...'
		matches = set()
		s = '.'
		while s != '':
			s = raw_input('  * ')
			uid = findByName(s)
			if len(uid) > 0:
				matches.add(uid)
		for m in males:
			if m in matches:
				training.append({'a':f,'b':m,'val':1})
			else:
				training.append({'a':f,'b':m,'val':0})
	fout = open('train-whsieh.json','w')
	fout.write(JSONEncoder().encode(training))
	fout.close()
	return training
