import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {SKRView} from '../SKRView';
import {DeveloperView} from '../Developer';
import {GeneralView} from './GeneralView';
import {IStream} from '../../api/streams';

export function Router({ data }: { data: IStream }) {
    const path = process.env.ASSET_PATH;
    return (
        <Routes>
            <Route path={`${path}*`} element={<GeneralView data={data}/>} />
            <Route path={`${path}view/skr`} element={<SKRView />} />
            <Route path={`${path}view/developer`} element={<DeveloperView />} />
        </Routes>
    )
}
