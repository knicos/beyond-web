# Source Service

A service for stream sources to connect to. It parses and handles incoming
stream data and forwards any reverse data back to the source. The stream data
is sent into redis pub/sub for use by other services.
