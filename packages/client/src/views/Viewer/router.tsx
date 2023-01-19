import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {SKRView} from '../SKRView';
import {DeveloperView} from '../Developer';
import {GeneralView} from './GeneralView';
import {IStream} from '../../api/streams';

export function Router({ data }: { data: IStream }) {
    return (
        <Routes>
            <Route path={`skr`} element={<SKRView />} />
            <Route path={`developer`} element={<DeveloperView />} />
            <Route path={`*`} element={<GeneralView data={data}/>} />
        </Routes>
    )
}
