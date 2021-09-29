import React from 'react';
import { useRecoilValue } from 'recoil';
import {Switch, Redirect, Route} from 'react-router';
import {Apps} from './views/Apps';
import {StreamIndex} from './views/StreamIndex';
import {currentSession} from './recoil/selectors';
import {Login} from './views/Login';

interface PrivateProps {
  isPrivate: boolean;
  children: React.ReactNode;
}

function PrivateRoute({ isPrivate, children, ...rest }: PrivateProps) {
  const path = process.env.ASSET_PATH;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        isPrivate ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: `${path}login`,
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

export function Router() {
    const path = process.env.ASSET_PATH;
    const session = useRecoilValue(currentSession);

    return (
        <Switch>
            <Route path={`${path}login`}>
              <Login />
            </Route>
            <PrivateRoute isPrivate={!!session}>
              <Route exact path={`${path}`} component={StreamIndex} />
              <Route path={`${path}apps`} component={Apps} />
            </PrivateRoute>
        </Switch>
    )
}
