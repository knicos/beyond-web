const basePath = process.env.ASSET_PATH;

const API_VERSION = 'v1';

export const API_PATH = `${basePath}${API_VERSION}`;
export const OAUTH2 = `${API_PATH}/oauth2`;
export const OAUTH2_VALIDATE = `${OAUTH2}/validate`;
export const OAUTH2_TOKEN = `${OAUTH2}/token`;
