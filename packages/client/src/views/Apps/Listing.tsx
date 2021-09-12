import React from 'react';
import {SelectableCard, Grid} from '../../components/SelectableCard/SelectableCard';
import {useHistory, useLocation} from 'react-router';

export function Listing() {
    const history = useHistory();
    const location = useLocation();
    console.log('QUERY', location)
    return (
        <Grid>
            <SelectableCard onClick={() => {
                history.push(`/apps/skr${location.search}`)
            }} selected={false}>
                SKR
            </SelectableCard>
            <SelectableCard onClick={() => {
                history.push(`/apps/viewer${location.search}`)
            }} selected={false}>
                Viewer
            </SelectableCard>
        </Grid>
    );
}
