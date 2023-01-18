# Playback Service

Provides `/v1/playback` endpoints for listing available FTL files and activating or stopping the playback of an FTL file. It is responsible for storing an index of such files and for reading and streaming the FTL data when requested. It emulates a live stream from a vision node.

## Dependencies
* Recorder service events
* Socket service stream events
