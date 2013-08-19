
import json as json
from util import *
from features import *
from time import time
from random import choice

G,C,FTVEC = None,None,None

class Graph:

	def __init__(self,root):
		self.root = root
		self.distance = {'inv':{},'bfs':{},'root':{}}
		self.clustering = {'w':{},'uw':{}}
		self.wdegree = {}
		self.totaledgeweight = 0.0
		self.totaledgecount = 0.0
		self.diameter = 0
		self.wdiameter = 0
		self.rootdiameter = 0
		self.rootwdiameter = 0
		self.ADJ = {}
		self.ADJ[root] = {}
		self.vlist = [root]

	def addVertex(self,vtx):
		self.ADJ[vtx] = {}
		self.vlist.append(vtx)

	def addLink(self,v1,v2,weight=1):
		if v1 not in self.ADJ:
			self.addVertex(v1)
		if v2 not in self.ADJ:
			self.addVertex(v2)
		self.ADJ[v1][v2] = weight
		self.ADJ[v2][v1] = weight

	def vertices(self):
		return self.vlist

	def __getitem__(self,vtx):
		if type(vtx) is tuple or type(vtx) is list:
			v0 = vtx[0]
			v1 = vtx[1]
			if v1 in self.ADJ[v0]:
				return self.ADJ[v0][v1]
			else:
				return 0
		else:
			return self.ADJ[vtx]

	def __setitem__(self,vs,weight):
		self.addEdge(vs[0],vs[1],weight)

def loadJSONDataset(fLabel='network-whsieh'):
	with open('datasets/' + fLabel + '.json') as rawdata:
		dataset = json.load(rawdata)
	rawdata.close()
	return dataset

def loadGraph(ds=loadJSONDataset()):
	root = ds['rootID']
	C = ds['contacts']
	G = Graph(root)
	for v0 in ds['vlist']:
		for v1 in ds[v0]:
			G.addLink(v0,v1,weight=ds[v0][v1])

	print 'Computing distance metrics...'
	start = time()
	for uid in G.vertices():
		if uid != root:
			G.distance['inv'][uid] = invWeightedDists(G,uid)
			G.wdiameter = max(G.wdiameter,max(G.distance['inv'][uid].values())/2.0)
			G.distance['bfs'][uid] = unweightedDists(G,uid)
			G.diameter = max(G.diameter,max(G.distance['bfs'][uid].values())/2.0)
		else:
			G.distance['root']['inv'] = invWeightedDists(G,root)
			G.rootwdiameter = max(G.distance['root']['inv'].values())
			G.distance['root']['bfs'] = unweightedDists(G,root)
			G.rootdiameter = max(G.distance['root']['bfs'].values())
	print '  Done! (' + str(int(1000*(time() - start))) + ' ms)'

	start = time()
	print 'Computing clustering metrics...'
	for uid in G.vertices():
		G.clustering['w'][uid] = wclustcoeff(G,uid)
		G.clustering['uw'][uid] = clustcoeff(G,uid)
		G.wdegree[uid] = sum(G[uid].values())
		G.totaledgeweight += G.wdegree[uid]
		G.totaledgecount += 1
	print '  Done! (' + str(int(1000*(time() - start))) + ' ms)'
	# print 'Computing centrality metrics...'
	# start = time()
	# G.centrality['betweenness'] = betweenness(G)
	# print '  Done! (' + str(1000*(time() - start)) + ' msec)'
	FTVEC = initFeatureVector(G)[0]
	return G,C,FTVEC

def findByName(name):
	for uid,info in C.items():
		if info['name'] == name:
			return uid
	return ''

def whois(t):
	u = type(t)
	if u is int or u is long:
		return C[str(t)]['name']
	if u is str or u is unicode:
		return C[t]['name']
	elif u is list or u is set:
		data = []
		for uid in t:
			data.append(whois(uid))
		return data
	elif u is dict:
		data = {}
		for uid in t:
			data[whois(uid)] = t[uid]
		return data

def validMatch(v1,v2):
	g1,i1 = C[v1]['gender'],C[v1]['interest']
	g2,i2 = C[v2]['gender'],C[v2]['interest']
	return (g1==i2 and g2==i1)

def printFeatureVector(v1,v2):
	print '    - Features for '+str(whois(v1))+' and '+str(whois(v2))
	for func in FTVEC:
		val = func(v1,v2)
		print '      * ' + func.__name__ + '=' + str(val)

G,C,FTVEC = loadGraph()

def testFeatures(trials=20):
	males = []
	females = []
	for uid in G.vertices():
		if uid != G.root:
			gender = C[uid]['gender']
			if gender == 'm':
				males.append(uid)
			elif gender == 'f':
				females.append(uid)
	for i in range(trials):
		m,f = choice(males),choice(females)
		printFeatureVector(m,f)
