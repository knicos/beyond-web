import React from 'react';
import {SelectableCard, Grid} from '../../components/SelectableCard/SelectableCard';
import {useHistory} from 'react-router';

export function Listing() {
    const history = useHistory();
    return (
        <Grid>
            <SelectableCard onClick={() => {
                history.push('/apps/skr')
            }} selected={false}>
                SKR
            </SelectableCard>
        </Grid>
    );
}
