import React from 'react';
import { useRecoilValue } from 'recoil';
import {Switch, Redirect, Route} from 'react-router';
import {Viewer} from './views/Viewer';
import {Dashboard} from './views/Dashboard';
import {currentSession} from './recoil/selectors';
import {Login} from './views/Login';

interface PrivateProps {
  isPrivate: boolean;
  children: React.ReactNode;
}

function PrivateRoute({ isPrivate, children, ...rest }: PrivateProps) {
  const path = process.env.ASSET_PATH;

  return (
    <Switch
      {...rest}
    >
      {isPrivate ? (
          children
        ) : (
          <Redirect
            to={`${path}login`}
          />
        )
      }
    </Switch>
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
              <Route path={`${path}view`} component={Viewer} />
              <Route path={`${path}`} component={Dashboard} />
            </PrivateRoute>
        </Switch>
    )
}
