import React from 'react';
import {Switch, Route} from 'react-router';
import {Apps} from './views/Apps';
import {StreamIndex} from './views/StreamIndex';

export function Router() {
    return (
        <Switch>
            <Route exact path="/" component={StreamIndex} />
            <Route path="/apps" component={Apps} />
        </Switch>
    )
}
