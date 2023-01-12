import React from 'react';
import {Routes, Route} from 'react-router';
import {Node} from '../Node';
import {Nodes} from '../Nodes';
import {Streams} from '../Streams';
import {StreamView} from '../Stream';
import {Recordings} from '../Recordings'
import MainListing from './MainListing';
import { UnderConstruction } from './UnderConstruction';

export function Router() {
    const path = process.env.ASSET_PATH;
    return (
        <Routes>
            <Route path={`${path}nodes/:id`} element={<Node/>} />
            <Route path={`${path}nodes`} element={<Nodes/>} />
            <Route path={`${path}streams/:id/:fsid/:fid`} element={<StreamView/>} />
            <Route path={`${path}streams`} element={<Streams/>} />
            <Route path={`${path}stats`} element={<UnderConstruction/>} />
            <Route path={`${path}recordings`} element={<Recordings/>} />
            <Route path={`${path}configs`} element={<UnderConstruction/>} />
            <Route path={`${path}users`} element={<UnderConstruction/>} />
            <Route path={`${path}groups`} element={<UnderConstruction/>} />
            <Route path={`${path}*`} element={<MainListing/>} />
        </Routes>
    )
}
