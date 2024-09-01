# Sync Engine

At a high level, I'm thinking:

1. Network request to fetch the initial state of the world.
1. Topological sort based on Id reference values.
1. Insert into ObjectPool singleton based on Top sort.
1. First insert initialzes the ObjectPool `root`, but the object graph is not yet fully hydrated
   until all objects are init
1.

If another write comes in:

- I'll create an update record and they'll just be emitted when I go back online
- When I come back online I need to catch up before processing my local queue
- Reject old changes (highest latest timestamp)

paul (local)
pb (remote)
save() -> emits the remote changes as a txn
paul bardea (local)
save() -> emits another change set

## Figure out writing to local storage

- Create a database
- Create objects
- Save objects

Data flow:

- bootstrap() -> Received data model is written to the data store
- addChange() -> Transaction is written down to storage

Startup:

- Do I have data locally?

  - NO: Request a full bootstrap and write the response to indexdb.
  - YES: Request a delta bootstrap that sends back all of the objects that have been modified since
    a particular version. Update indexdb with the new models.

- Change is made: make it in memory

- Applying change from server -> Update the relevant model in indexdb.

Offline:
* Add transaction to queue
* Timeout/detect no connection

TODO: Maybe don't send the version?
* Reconnect:

  1. Start queueing websocket events
  1. Emit queued changes (Drain queue)
  1. Get delta bootstrap
  1. Apply delta bootstrap
  1. Start applying changes from server and stop queueing them

## Server Endpoints

Authentication: Custom JWT. I just need a username and team.

### GET /bootstrap

Finds all of the elements that I have access to (e.g. Inside my team).
Return (eventually stream) an array of all of the JSON objects.

### POST /change

Takes a change in and applies it dynamically to the correct data model.

### LISTEN /sync

Each message streams a CHANGE event.

How does the latest timestamp update here? Is this better than just sending
the latest version of each object?
