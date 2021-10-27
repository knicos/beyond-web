import React from 'react';
import {Switch, Route} from 'react-router';
import {Node} from '../Node';
import {Nodes} from '../Nodes';
import {Streams} from '../Streams';
import {StreamView} from '../Stream';
import MainListing from './MainListing';
import { UnderConstruction } from './UnderConstruction';

export function Router() {
    const path = process.env.ASSET_PATH;
    return (
        <Switch>
            <Route path={`${path}nodes/:id`} component={Node} />
            <Route path={`${path}nodes`} component={Nodes} />
            <Route path={`${path}streams/:id/:fsid/:fid`} component={StreamView} />
            <Route path={`${path}streams`} component={Streams} />
            <Route path={`${path}stats`} component={UnderConstruction} />
            <Route path={`${path}configs`} component={UnderConstruction} />
            <Route path={`${path}users`} component={UnderConstruction} />
            <Route path={`${path}groups`} component={UnderConstruction} />
            <Route path={`${path}`} component={MainListing} />
        </Switch>
    )
}
