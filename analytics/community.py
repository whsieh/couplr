#!/usr/bin/env python

import numpy as np
from numpy import linalg as la
from copy import copy

class Graph:

	def __init__(self,vcount):
		self.T = [dict() for _ in xrange(vcount)]
		self.ecount = 0
		self.wcount = 0
		self.vcount = vcount
	
	def addEdge(self,v1,v2,weight):
		weight = 1 if weight is None else weight
		if v1 == v2:
			print 'Warning: self edges not allowed.'
			return False
		else:
			self.T[v1][v2] = weight
			self.T[v2][v1] = weight
			self.ecount += 1
			self.wcount += weight
			return True

	def deg(self,v):
		return len(self.T[v])

	def wdeg(self,v):
		return sum(self.T[v].values())

	def __getitem__(self,vargs):
		if type(vargs) is tuple:
			v0 = vargs[0]
			v1 = vargs[1]
			if v1 in self.T[v0]:
				return self.T[v0][v1]
			else:
				return 0
		else:
			return self.T[vargs]

	def __setitem__(self,vs,weight):
		self.addEdge(vs[0],vs[1],weight)

	def __str__(self):
		r = ''
		for i in xrange(self.vcount):
			r += str(i) + ':' + str(self.T[i]) + ' ; '
		return r[:-2:]

	def matrix(self,f=None):
		f = (lambda u,v : g.T[u][v] if v in g.T[u] else 0) if f is None else f
		M = np.zeros((self.vcount,self.vcount),dtype=np.int32)
		for i in xrange(self.vcount):
			for j in xrange(i,self.vcount):
				k = f(i,j)
				M[i][j],M[j][i] = k,k
		return M

def modularityMatrix(g):
	A = g.matrix()
	D = g.matrix(f=lambda u,v : g.wdeg(u)*g.wdeg(v))
	return A - (D/float(2*g.wcount))

def wsum(vec,mat):
	t,k = np.zeros(len(vec)),0
	for a in vec:
		t += (a*mat[:,k])
		k += 1
	return t

def buildSets(s):
	p0,p1,p2 = set(),set(),set()
	for i in xrange(len(s)):
		k = s[i]
		if k == -1:
			p1.add(i)
		elif k == 1:
			p2.add(i)
		elif k == 0:
			p0.add(i)
	return p0,p1,p2

if __name__ == '__main__':

	# g = Graph(7)
	# g[0,2] = 2
	# g[2,5] = 1
	# g[0,5] = 9
	# g[1,3] = 3
	# g[3,4] = 8
	# g[1,4] = 6
	# g[3,6] = 1
	# g[4,6] = 4
	# g[1,6] = 7
	# g[2,4] = 1

	# g = Graph(10)
	# g[0,4] = 1
	# # g[1,7] = 1
	# # g[3,7] = 1
	# # g[1,3] = 1
	# g[0,9] = 1
	# g[4,8] = 1
	# g[8,6] = 1
	# g[6,9] = 1
	# g[9,8] = 1
	# g[9,4] = 1
	# g[9,2] = 1
	# g[9,5] = 1
	# g[7,5] = 1
	# g[5,3] = 1
	# g[5,1] = 1

	g = Graph(9)
	g[0,1] = 1
	g[0,6] = 1
	g[1,6] = 1
	g[1,7] = 1
	g[6,7] = 1
	g[0,7] = 1
	g[4,7] = 1
	g[2,7] = 1
	g[2,8] = 1
	g[2,3] = 1
	g[3,5] = 1
	g[4,5] = 1
	g[4,8] = 1

	print '\n1. Adjacency matrix'
	A = g.matrix(f=lambda u,v : (g.T[u][v] if v in g.T[u] else 0))
	print A

	print '\n2. Modularity matrix'
	B = modularityMatrix(g)
	print B

	print '\n3. Leading eigenvector'
	values,vectors = la.eig(B)
	eigvec = vectors[:,np.argmax(values)]
	print eigvec

	print '\n4. Proposed community partition'
	s = np.sign(eigvec).astype(np.int8)
	p0,p1,p2 = buildSets(s)
	print '  Group1: ' + str(p1)
	print '  Group2: ' + str(p2)
	print '  In limbo: ' + str(p0)

	print '\n5. Initial modularity (before refinement)'
	Q = np.dot(np.dot(s.T,B),s)
	print '  Q = ' + str(Q/(4*g.wcount))

	# print '\n6. Final modularity (after refinement)'
	# bestS = copy(s)
	# for i in xrange(len(s)):
	# 	si = s[i]
	# 	s[i] = -1*si
	# 	q = np.dot(np.dot(s.T,B),s)
	# 	if q > Q:
	# 		Q = q
	# 		bestS = copy(s)
	# 	# else:
	# 	s[i] = si
	# p0,p1,p2 = buildSets(bestS)
	# print '  Group1: ' + str(p1)
	# print '  Group2: ' + str(p2)
	# print '  In limbo: ' + str(p0)
	# print '  Q = ' + str(Q/(4*g.wcount))
	