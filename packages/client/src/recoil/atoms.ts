import {atom} from 'recoil';

export const pageTitle = atom({
    key: 'pageTitle',
    default: '',
});

export const streamList = atom({
    key: 'streamList',
    default: [],
});

export const currentStream = atom({
    key: 'currentStream',
    default: null,
    dangerouslyAllowMutability: true,
});

export const peer = atom({
    key: 'peer',
    default: null,
    dangerouslyAllowMutability: true,
});

export const frameTime = atom({
    key: 'frameTime',
    default: 0,
});
