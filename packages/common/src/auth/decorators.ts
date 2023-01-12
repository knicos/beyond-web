import {
  UseAuth, UseParam, ParamTypes, Controller as TSEDController, Req,
} from '@tsed/common';
import { useDecorators } from '@tsed/core';
import {
  Security, Returns, In, JsonEntityFn, JsonEntityStore,
} from '@tsed/schema';
import AuthMiddleware from './middleware';

export function Controller(path: string): any {
  return useDecorators(
    TSEDController(path),
    UseAuth(AuthMiddleware, {}),
    Security('oauth', ...([])),
    In('header').Name('Authorization').Type(String).Required(true),
    Returns(401).Description('Unauthorized'),
    Returns(403).Description('Forbidden'),
  );
}

export function Public(): any {
  return JsonEntityFn((store: JsonEntityStore) => {
    In('header').Name('Authorization').Type(String).Required(false)(store.target, store.propertyKey, store.descriptor);
    store.operation.security([]);
  });
}

export function UseToken(): ParameterDecorator {
  return UseParam({
    expression: 'request.accessToken',
    useMapper: false,
    useValidation: false,
    paramType: ParamTypes.$CTX,
  });
}
