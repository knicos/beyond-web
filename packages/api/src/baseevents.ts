export interface BaseEventBody {
  id: string;
  operationId?: string;
  sessionId?: string;
  userId?: string;
  clientId?: string;
}

export interface BaseEvent {
  event: string;
  body: BaseEventBody;
}
