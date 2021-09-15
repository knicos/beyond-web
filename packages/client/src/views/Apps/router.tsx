import React from 'react';
import {Switch, Route} from 'react-router';
import {SKRView} from '../SKRView';
import {DeveloperView} from '../Developer';
import {Listing} from './Listing';

export function Router() {
    const path = process.env.ASSET_PATH;
    return (
        <Switch>
            <Route exact path={`${path}apps`} component={Listing} />
            <Route path={`${path}apps/skr`} component={SKRView} />
            <Route path={`${path}apps/developer`} component={DeveloperView} />
        </Switch>
    )
}
