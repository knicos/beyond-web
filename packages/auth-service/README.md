# Authentication Service

Provides an OAuth2 authentication service, generating access tokens that
other services can authorise against. These tokens are stored in Redis to
allow other services to directly find them without asking the auth-service.

The endpoints provided are:
* `/v1/users`
* `/v1/groups`
* `/v1/clients`
* `/v1/oauth2`

## Dependencies
None
