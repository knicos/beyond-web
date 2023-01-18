# FTL Web Services and Application

This is a monorepo containing all web services and the client application. Each service and the client can be found as individual packages, along with other common library packages. `lerna` and `yarn` are used to manage the build and test process.

## Development
Use vscode and devcontainers. First clone the repository and then open the folder in vscode. Initially do not open in a devcontainer because an install process must be done first:

In the vscode terminal, enter:
```bash
yarn --frozen-lockfile
```

The above requires yarn and nodejs to be installed on your local machine. An alternative to the above (and allowing direct opening in devcontainer) is to install `lerna` globally on your machine.

Then reopen in a devcontainer and enter the following in a terminal:

```bash
yarn build
yarn build:client
```

vscode might require a restart, but it should be able to automatically start all of the services and the application on localhost. Go to http://localhost:8080 to see the application.

### Building

Running `yarn build` will rebuild all the services, however it uses a cache so only builds if the source has changed. It also builds dependencies in the correct order. When modifying service code directly, there is no need to build since the services will automatically restart. However, if a change is made to another library package then it must be built.

vscode will restart services when their code or dependent packages change.

### Packages
Check the README file in each packages for more information.

### Common Libraries
* "packages/api": Typescript service API definitions, for Redis events
* "packages/types": Could be deprecated, contains common service types
* "packages/common": Common service functions
* "packages/protocol": Deprecated, replaced with `@beyond/protocol` but still used partially by client
* "packages/player": React component to play the 3D video stream in the browser
* "packages/stream": A wrapper around the websocket protocol to manage individual streams

### Services
* "packages/auth-service": Authentication, users and groups.
* "packages/diagnostic-service": Collects log and metric data for OpenSearch
* "packages/node-service": Records and provides information on connected machines
* "packages/playback-service": Play previously recorded FTL files
* "packages/recorder-service": Record a live stream to file
* "packages/socket-service": Provide a websocket connection for nodes for streaming
* "packages/stream-service": Records and provides information about active streams

### Additional Tools
Additional services are started by vscode to provide additional web environments for accessing various aspects of the system:

* Mongo Express (http://localhost:8083) for exploring the database
* RedisInsight (http://localhost:8001) for exploring Redis database and streams
* OpenSearch Dashboards (http://localhost:5601) for viewing logs and metrics

### Initial Configuration
Upon first install, at least the following modifications are needed:

1. Go to RedisInsight and add the database (host: redis, port: default).
2. Go to OpenSearch Dashboards and add the indexes. Login is admin, admin. Select the menu icon, top left and choose "Stack Management". Then choose "Index Patterns" and "Create index pattern", doing this 3 times for each of these index strings: "beyondlog", "beyondnode" and "beyondservice". Now you can create any dashboards and visualisations using these indices.
3. Go to Mongo Express to add a new auth->clients. Click "New Document" and add the following where `<SECRET>` is replaced with a password:

```
{
    name: 'Sockets',
    grantTypes: [
        'client_credentials'
    ],
    secret: '<SECRET>',
    expiryTTL: 43200,
    groups: [
        '62a625b17fa36733f7b083c9'
    ]
}
```

The groups id must match the root group, which can be found in the auth->groups collection. Adding this client allows for node connections using HTTP basic authentication where the username is the generated client ID number, and the password is the provided secret.

### Testing
Tests are located within each package under the "test" directory. To run all the tests, use `yarn test` in the repository root. This will execute only the tests for source code that has been modified since the last call to "test". It is also possible to test specific packages only.

## Deployment
Gitlab CI/CD pipelines are configured to manually generate docker images from the master branch. Go to the pipelines and click "play" on the relevant deploy step. This generates and publishes the new image, after which a webhook on our server will be triggered to pull the new image and restart the corresponding service.

It is recommended to deploy one service at a time and verify it is working before continuing.

To check on the status of the deployment, view logs directly or manual control the services, ssh into the `app.ftlab.utu.fi` machine. Then `cd /srv/ftl/webapp`, change to the `ftl` user and follow one of the example commands below:

* `docker-compose up -d` to ensure everything is running and started
* `docker-compose restart <SERVICE>` to force a reboot of a service
* `docker-compose pull` to pull new docker images
* `vim ./docker-compose.yml` to edit the production configuration.
* `docker-compose logs <SERVICE>` to view console logs
* `docker-compose ps` to list current status of all containers
* `sudo vim /etc/nginx/sites-enabled/default` to edit the outer reverse proxy or SSL
* `sudo systemctl restart nginx` to reboot the main reverse proxy.

Webhooks are configured in the `/srv/ftl` directory also.

### Monitoring Tools
Additional services are provided to monitor the production system, these are hidden behind an extra password.

* Mongo Express (https://app.ftlab.utu.fi/mongo) for exploring the database
* RedisInsight (https://app.ftlab.utu.fi/insight) for exploring Redis database and streams
* OpenSearch Dashboards (https://app.ftlab.utu.fi/opensearch) for viewing logs and metrics
* Docker Registry (https://app.ftlab.utu.fi/docker) for a UI to the registry

## Usage
The default username and password is admin, admin. There is currently no simple mechanism to change the password, it can be done by making manual POST requests to the correct auth-service endpoint. The production system has a non-default password.

Vision nodes and other applications can connect a websocket to `/v1/socket` and then use the protocol library.
