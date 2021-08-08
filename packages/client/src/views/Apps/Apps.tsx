import React, {useEffect} from 'react';
import {useSetRecoilState} from 'recoil';
import {pageTitle} from '../../recoil/atoms';
import {Router} from './router';

export function Apps() {
    const setTitle = useSetRecoilState(pageTitle);

    useEffect(() => {
        setTitle('Select Application');
    }, []);

    return <Router />;
}
