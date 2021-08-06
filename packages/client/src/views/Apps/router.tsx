import React from 'react';
import {Switch, Route} from 'react-router';
import {SKRView} from '../SKRView';
import {Listing} from './Listing';

export function Router() {
    return (
        <Switch>
            <Route exact path="/apps" component={Listing} />
            <Route path="/apps/skr" component={SKRView} />
        </Switch>
    )
}
