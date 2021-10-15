import { redisSendEvent } from '@ftl/common';

export type ConfigCommandType = 'restore';

export interface ConfigCommand {
  id: string;
  cmd: ConfigCommandType;
  framesetId: number;
  frameId: number;
  params?: Record<string, unknown>;
}

export function sendConfigCommand(cmd: ConfigCommand) {
  redisSendEvent('command:config', cmd);
}
