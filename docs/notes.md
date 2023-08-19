## Network

### Sync

The sync component handles serialisation and de-serialisation of objects and their components.

-   number `identity` is used to identify the environment, clients / server (server's identity is 0, every next client +1)
-   BaseObject is created, components are assigned. One of the components is Sync.
-   Use the `authorise` method to give specific environment authority over the individual components.  
    note: server will serialise all the components of the object, when the object is being sent for a first time to the specific client.
-   Sync keeps track of the clients when serialising the data, comparing last serialised cacheId to the current one when using `writeAuthorityBits` with provided target.
-   `writeAllBits` will write bits regardless of cache or authority
-   other party can use `resolveBits` to create or update local copy of the object and it's components

### Messages

Messages are used used to communicate arbitrary (but pre-defined) information. Messages are sent before objects. The `Message` class has `read` and `write` methods, which are exposed via `Client` class on the server, and `Network` class on the server. 

## Detection

Server uses a detection system to provide the clients with only the necessary information. 

### Detectable

`Detectable` class is a non-network component that represents objects ability to be detected. It works with in conjunction with the `Detector` component.

### Detector

The `Detector` component represents the ability of an object to gather information about `Detectable` objects. Detectors will provide a client or clients with a set of Detectables, which will be serialised for that client and sent. 



## flow

**server**  
Server creates an object - a fish. The fish will have `FishBehaviour`, `Sync` and `RangeDetectable` among other things. The server will claim authority on `FishBehaviour`.  Tick ends, nothing happens.  

**client**  
Client doesn't receive anything interesting.

**server**  
Fish moves around, and gets close enough to a submarine to be detected by it's sonar.  
The submarine, which belongs to a `Client`, has a `RangeDetector`. The detector will check the detectable of the fish, and since it matches the detection condition, the `Detectable` on the fish will be `track`ed by the `Client`. During serialisation, the client will serialise the fish using `writeAllBits`, and marks it as initialised.  

**client**  
Client will `resolveBits`, and since it has no object with this netId, it will create a local copy of the fish object, with all the information that the server provided. It will use client version of some components like `Drawable`

**server**  
Next tick, `RangeDetector` of the client checks the fish again. Since it still matches the detection condition `track` is called again. `Client` will serialise the fish using `writeAuthorityBits`, since the fish is already initialised.  

**client**  
During `resolveBits` the client will find the object with that netId already exists, and applies the data on it. It only received some of the data, since server claimed authority only on some of the components. Existing components might reconcile the differences in the new server data and locally simulated data.   

**server**  
After a while, the fish gets out of range of the sonar. `RangeDetector` will not call `track` on the client with the fish. During serialisation, client will notice that the fish has stopped being tracked, and skips the serialisation. It will also write a message notifying the client that the fish is no longer tracked. (the message will be sent next tick)


**client**  
Client does not receive any new fish bits. It will proceed to simulate the fish locally.

**server**  
The queued message is now sent.

**client**
Client reads the message, and promptly removes the fish.





## ObjectScope
Object scopes represent a set of objects, that exist in some context. Two main scopes are `game` and `network`. Every object should exist at least in one scope, but can exist in more. Object has one id per scope it is scoped in. 

The `game` scope represents a local scope, while the `network` scope represents the shared set of object. Object will have same `network` scope id in all environments (provided they exist there at all), but might have different `game` id. Clients may only create objects in the `game` scope. Only server is allowed to create (choose id) for an object in `network` scope.