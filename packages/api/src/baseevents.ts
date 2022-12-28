export interface BaseEventBody {
  id: string;
}

export interface BaseEvent {
  event: string;
  body: BaseEventBody;
}
