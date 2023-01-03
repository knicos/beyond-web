import { installMonitor } from '@ftl/common';
import app from './app';

const server = app.listen(8080);
installMonitor(server);
