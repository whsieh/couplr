
from Queue import PriorityQueue

def invWeightedDists(G,v0,ignoreRoot=True):
	dists = {}
	frontier = PriorityQueue()
	frontier.put((0,v0))
	while not frontier.empty():
		dst,vtx = frontier.get()
		if not vtx in dists:
			dists[vtx] = dst
			for vn in G[vtx]:
				if not vn in dists:
					if not ignoreRoot or vn != G.root:
						k = dst + (1.0/G[vtx][vn])
						frontier.put((k,vn))
	return dists

def unweightedDists(G,v0,ignoreRoot=True):
	dists = {}
	frontier = []
	frontier.append((0,v0))
	while len(frontier) is not 0:
		dst,vtx = frontier.pop(0)
		if not vtx in dists:
			dists[vtx] = dst
			for vn in G[vtx]:
				if not vn in dists:
					if not ignoreRoot or vn != G.root:
						k = dst + 1
						frontier.append((k,vn))
	return dists

"""
http://personal.strath.ac.uk/d.j.higham/papers/Kalna_aicom08.pdf
"""
def wclustcoeff(G,vk):
	adj = G[vk].keys()
	numer,denom = 0.0,0.0
	for a in range(len(adj)):
		for b in range(a+1,len(adj)):
			va,vb = adj[a],adj[b]
			wka,wkb = G[vk][va],G[vk][vb]
			wab = G[va][vb] if vb in G[va] else 0
			t = wkb*wkb
			numer += (wab*t)
			denom += t
	return 0 if denom==0 else numer/denom

def clustcoeff(G,vk):
	adj = G[vk].keys()
	tcount,acount = 0.0,(len(adj)*(len(adj)-1))/2
	for a in range(len(adj)):
		for b in range(a+1,len(adj)):
			va,vb = adj[a],adj[b]
			if vb in G[va]:
				tcount += 1
	return tcount/acount if acount != 0 else 0