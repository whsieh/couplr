
def initFeatureVector(G):
	fVector = []
	# The weight of mutual neighbors
	def mutual_links(v1,v2):
		shared = 0.0
		for vn in G[v1]:
			if vn in G[v2]:
				shared += G[v1][vn]
				shared += G[v2][vn]
		return shared / (G.wdegree[v1]+G.wdegree[v2])
	fVector.append(mutual_links)

	# Weighted inverse shortest path
	def invdist_weighted(v1,v2):
		return G.distance['inv'][v1][v2]/G.wdiameter
	fVector.append(invdist_weighted)
	
	# Unweighted shortest path
	def dist_unweighted(v1,v2):
		return G.distance['bfs'][v1][v2]/float(G.diameter)
	fVector.append(dist_unweighted)
	
	# Min inverse dist from root
	def min_invrootdist_weighted(v1,v2):
		rootDists = G.distance['root']['inv']
		return min(rootDists[v1],rootDists[v2])/G.rootwdiameter
	fVector.append(min_invrootdist_weighted)
	
	# Max inverse dist from root
	def max_invrootdist_weighted(v1,v2):
		rootDists = G.distance['root']['inv']
		return max(rootDists[v1],rootDists[v2])/G.rootwdiameter
	fVector.append(max_invrootdist_weighted)
	
	# Min inverse dist from root
	def min_rootdist_unweighted(v1,v2):
		rootDists = G.distance['root']['bfs']
		return min(rootDists[v1],rootDists[v2])/float(G.rootdiameter)
	fVector.append(min_rootdist_unweighted)
	
	# Max inverse dist from root
	def max_rootdist_unweighted(v1,v2):
		rootDists = G.distance['root']['bfs']
		return max(rootDists[v1],rootDists[v2])/float(G.rootdiameter)
	fVector.append(max_rootdist_unweighted)
	
	# Min clustering coefficient x degree
	def min_clustcoeff_deg(v1,v2):
		a = G.clustering['uw'][v1]*len(G[v1])/G.totaledgecount
		b = G.clustering['uw'][v2]*len(G[v2])/G.totaledgecount
		return min(a,b)
	fVector.append(min_clustcoeff_deg)
	
	# Max clustering coefficient x degree
	def max_clustcoeff_deg(v1,v2):
		a = G.clustering['uw'][v1]*len(G[v1])/G.totaledgecount
		b = G.clustering['uw'][v2]*len(G[v2])/G.totaledgecount
		return max(a,b)
	fVector.append(max_clustcoeff_deg)
	
	# Min weighted clustering coefficient x degree
	def min_wclustcoeff_wdeg(v1,v2):
		a = G.clustering['w'][v1]*G.wdegree[v1]/G.totaledgeweight
		b = G.clustering['w'][v2]*G.wdegree[v2]/G.totaledgeweight
		return min(a,b)
	fVector.append(min_wclustcoeff_wdeg)
	
	# Max weighted clustering coefficient x degree
	def max_wclustcoeff_wdeg(v1,v2):
		a = G.clustering['w'][v1]*G.wdegree[v1]/G.totaledgeweight
		b = G.clustering['w'][v2]*G.wdegree[v2]/G.totaledgeweight
		return max(a,b)
	fVector.append(max_wclustcoeff_wdeg)
	
	def evaluate_all_features(v1,v2):
		f = [0]*len(fVector)
		for k,func in enumerate(fVector):
			f[k] = func(v1,v2)
		return f

	return fVector,evaluate_all_features