# FTL Client Application
A React.js web application packaged using webpack. The client includes its own nginx reverse proxy to map each of the service endpoints correctly (see "reverseproxy.conf" if you need to add new services).

## Build Process
Run `yarn build:client` to generate a new webpack build of the application. This produces the bundle files for the browser.

The remainder of the build process can be found in "../../docker/Dockerfile.client" which describes how to build the docker image. This involves configuring an Nginx server using the "reverseproxy.conf" and "nginx.conf" files found in this directory, along with installing the bundle files generated about.

## Development
vscode devcontainers will automatically start the client at http://localhost:8080 and watch for any source file change to rebuild as needed.

### Testing
There are currently no client tests.

### Architecture
The React components operate at approximately 3 levels:
1. Application level routers and state management components, including menus (./src/App.tsx)
2. Views which a roughly correlated to application pages (./src/views/...)
3. Components that are individual UI widgets of varying complexity (./src/components)

For the React components, `styled-components` is used for CSS styling.

In addition to the React components there are:
* `api` which defines the HTTP REST API to the backend services
* `lib` for small utility functions
* `recoil` that defines and manages application level state
* `services` are still React components but with non-UI roles

The `<PeerRoot>` service is responsible to connecting a global websocket connection to our web services, whilst the `<StreamWatcher>` simply allows the UI to update periodically when a stream is playing.

## Deployment
Deployment uses the main Gitlab CI/CD pipelines configuration. The process involves building and pushing the new docker image before triggering a webhook to reload the image on the production server.