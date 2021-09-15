import React from 'react';
import {SelectableCard, Grid} from '../../components/SelectableCard/SelectableCard';
import {useHistory, useLocation} from 'react-router';

export function Listing() {
    const path = process.env.ASSET_PATH;
    const history = useHistory();
    const location = useLocation();

    return (
        <Grid>
            <SelectableCard onClick={() => {
                history.push(`${path}apps/skr${location.search}`)
            }} selected={false}>
                SKR
            </SelectableCard>
            <SelectableCard onClick={() => {
                history.push(`${path}apps/developer${location.search}`)
            }} selected={false}>
                Developer
            </SelectableCard>
        </Grid>
    );
}
