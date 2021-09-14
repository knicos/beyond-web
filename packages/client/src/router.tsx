import React from 'react';
import {Switch, Route} from 'react-router';
import {Apps} from './views/Apps';
import {StreamIndex} from './views/StreamIndex';

export function Router() {
    const path = process.env.ASSET_PATH;
    console.log('PATH', path);

    return (
        <Switch>
            <Route exact path={`${path}`} component={StreamIndex} />
            <Route path={`${path}apps`} component={Apps} />
        </Switch>
    )
}
