import {atom} from 'recoil';

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
