import { useStore } from 'src/store'
import bigInt from "big-integer";
import { Bit } from "src/types";
import { stringToBitArray } from "src/parse";
import { valueToFields } from 'src/format'
import {
  UartClient
} from "re-uart";

export interface ReadResponseEvent {
  addr: bigInt.BigInteger;
  data: Bit[];
}

export class HardwareClientManager {
  adapter: UartClient;
  isConnected: boolean;

  constructor() {
    this.adapter = new UartClient(
      this.receivedReadResponse,
      (message: string) => {
        console.log(message);
      },
    );

    this.isConnected = false;
  }

  async connect() {
    try {
      await this.adapter.connect();
      this.isConnected = true;
    } catch {
      // Ignore
    }
  }

  async disconnect() {
    try {
      await this.adapter.disconnect();
    } finally {
      this.isConnected = false;
    }
  }

  async write(addr: number, data: number) {
    await this.adapter.write(addr, data);
  }

  async read(addr: number) {
    await this.adapter.read(addr);
  }

  receivedReadResponse(addr: number, data: number) {
    const store = useStore();
    const response: ReadResponseEvent = {
      addr: bigInt(addr),
      data: stringToBitArray("0x" + data.toString(16)),
    };
    const element = store.findRegByAddr(response.addr);
    if (element && element.fields) {
      valueToFields(store.swap, response.data, element.fields);
    }
    store.lastReceivedReadResponse = response;
  }
}
