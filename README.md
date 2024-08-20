# Sync Engine

At a high level, I'm thinking:

1. Network request to fetch the initial state of the world.
1. Topological sort based on Id reference values.
1. Insert into ObjectPool singleton based on Top sort.
1. First insert initialzes the ObjectPool `root`, but the object graph is not yet fully hydrated
   until all objects are init
1.
