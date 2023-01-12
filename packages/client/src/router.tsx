import React from 'react';
import { useRecoilValue } from 'recoil';
import {Routes, Route} from 'react-router';
import {Viewer} from './views/Viewer';
import {Dashboard} from './views/Dashboard';
import {currentSession} from './recoil/selectors';
import {Login} from './views/Login';

export function Router() {
    const path = process.env.ASSET_PATH;
    const session = useRecoilValue(currentSession);

    return (
        <Routes>
          {
            (!!session) ? <>
              <Route path={`${path}view/*`} element={<Viewer/>} />
              <Route path={`${path}*`} element={<Dashboard/>} />
            </> : <>
              <Route path={`${path}*`} element={<Login/>} />
            </>
          }
        </Routes>
    )
}
