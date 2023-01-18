# FTL API

Defines all Typescript interfaces for the inter-service messaging API. It should (or will) contain the interfaces for the REST API also. Most of the API is owned by a particular service, in which case it is in the corresponding service directory in src.

To add a new event: Create an interface that inherits from BaseEvent, and an event body interface which inherits from BaseEventBody. In `src/events.ts` you will need to then add that event to the `Event` type definition.

The API package should not contain any actual code, only type definitions.