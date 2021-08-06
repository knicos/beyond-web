import {selector} from 'recoil';

export const streamList = selector({
    key: 'streamList',
    get: async () => {
        return [
            {
                uri: 'ftl://vision.utu.fi/nickslap',
                name: 'Test Stream'
            },
        ];
    },
});
