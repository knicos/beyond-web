export type TokenType = 'Basic' | 'Bearer' | 'Unknown';

interface IUser {
    id: string;
    name: string;
    username: string;
}

export interface AccessToken {
    id: string;
    user?: IUser;
    groups: string[];
    scopes: string[];
    bearer?: string;
    scope: string;
}