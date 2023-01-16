import {
  LogBody, NodeSummaryMetricBody, ServiceMetricBody,
} from '@ftl/api';
import { redisSetGroup, redisSetStreamCallback, redisStreamListen } from '@ftl/common';
import axios from 'axios';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false,
});

axios.defaults.httpsAgent = agent

redisSetGroup('diagnostic-service');

axios.put('https://opensearch:9200/beyondlog', JSON.stringify({}), {
  auth: {
    username: 'admin',
    password: 'admin',
  },
  headers: {
    'Content-type': 'application/json',
  },
}).catch((r) => {
  console.error('Error', r.message);
}).then((v) => {
  console.log('Res', v);
});

redisSetStreamCallback('events:service:metric', async (data: ServiceMetricBody) => {
  const timeData = {
    ...data,
    timestamp: new Date(data.endTime).toISOString(),
  }
  await axios.post('https://opensearch:9200/beyondservice/_doc', JSON.stringify(timeData), {
    auth: {
      username: 'admin',
      password: 'admin',
    },
    headers: {
      'Content-type': 'application/json',
    },
  });
});

redisSetStreamCallback('events:node:metric', async (data: NodeSummaryMetricBody) => {
  const timeData = {
    ...data,
    timestamp: new Date().toISOString(),
  }
  await axios.post('https://opensearch:9200/beyondnode/_doc', JSON.stringify(timeData), {
    auth: {
      username: 'admin',
      password: 'admin',
    },
    headers: {
      'Content-type': 'application/json',
    },
  });
});

redisSetStreamCallback('events:log', async (data: LogBody) => {
  const timeData = {
    ...data,
    timestamp: new Date(data.timestamp).toISOString(),
  }
  await axios.post('https://opensearch:9200/beyondlog/_doc', JSON.stringify(timeData), {
    auth: {
      username: 'admin',
      password: 'admin',
    },
    headers: {
      'Content-type': 'application/json',
    },
  });
});

redisStreamListen();
