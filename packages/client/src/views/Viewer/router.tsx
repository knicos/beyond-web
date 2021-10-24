import React from 'react';
import {Switch, Route} from 'react-router';
import {SKRView} from '../SKRView';
import {DeveloperView} from '../Developer';
import {GeneralView} from './GeneralView';
import {IStream} from '../../api/streams';

export function Router({ data }: { data: IStream }) {
    const path = process.env.ASSET_PATH;
    return (
        <Switch>
            <Route exact path={`${path}view`} render={props => <GeneralView {...props} data={data} />} />
            <Route path={`${path}view/skr`} component={SKRView} />
            <Route path={`${path}view/developer`} component={DeveloperView} />
        </Switch>
    )
}
