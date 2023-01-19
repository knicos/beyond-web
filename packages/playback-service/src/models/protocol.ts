// Wrapper classes for Packet, StreamPacket and DataPacket
// TODO: move to common api

export class StreamPacket {
  data: any; // original msgpack decoded data

  public getTimestamp() : number { return this.data[0]; }
  public setTimestamp(value : number) { this.data[0] = value; }

  public getStreamId() : number { return this.data[1]; }
  public setStreamId(value : number) { this.data[1] = value; }

  public getFrameNumber() : number { return this.data[2]; }
  public setFrameNumber(value : number) { this.data[2] = value; }

  public getChannel() : number { return this.data[3]; }
  public setChannel(value : number) { this.data[3] = value; }

  public getFlags() : number { return this.data[4]; }
  public setFlags(value : number) { this.data[4] = value; }

  constructor(data) {
    this.data = data
  }
}

export class DataPacket {
  data: any; // original msgpack decoded data

  public getCodec() : number { return this.data[0]; }// enum
  public setCodec(value : number) { this.data[0] = value; }

  // data[1] reserved

  public getFrameCount() : number { return this.data[2]; }
  public setFrameCount(value: number) { this.data[2] = value; }

  public getBitRate() : number { return this.data[3]; }
  public settBitRate(value : number) { this.data[3] = value; }

  public getData() : Uint8Array { return this.data[5]; }
  public setData(value: Uint8Array) { this.data[5] = value; }

  public getDataFlags() : number { return this.data[4]; }
  public setDataFlags(value : number) { this.data[4] = value; }

  constructor(data) {
    this.data = data;
  };
}

export class Packet {
  spkt: StreamPacket;
  dpkt: DataPacket;

  constructor(data) {
    this.spkt = new StreamPacket(data[0]);
    this.dpkt = new DataPacket(data[1]);
  }
};
