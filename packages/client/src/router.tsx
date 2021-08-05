import React from 'react';
import {Switch, Route} from 'react-router';
import {SKRView} from './views/SKRView';

export function Router() {
    return (
        <Switch>
            <Route exact path="/" >
                Welcome
            </Route>
            <Route path="/skr" component={SKRView} />
        </Switch>
    )
}
