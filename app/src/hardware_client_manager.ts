import { useStore } from 'src/store'
import bigInt from "big-integer";
import { Bit } from "src/types";
import { stringToBitArray } from "src/parse";
import { valueToFields } from 'src/format'
import { RegvueHardwareClientInterface } from 'regvue-hardware-client-interface';

export interface ReadResponseEvent {
  addr: bigInt.BigInteger;
  data: Bit[];
}

export class HardwareClientManager {
  adapter: RegvueHardwareClientInterface | null;
  isConnected: boolean;
  isLoaded: boolean;

  constructor() {
    this.adapter = null;
    this.isConnected = false;
    this.isLoaded = false;
  }

  async connect() {
    if (this.adapter) {
      try {
        await this.adapter.connect();
        this.isConnected = true;
      } catch {
        // Ignore
      }
    }
  }

  async disconnect() {
    if (this.adapter) {
      try {
        await this.adapter.disconnect();
      } finally {
        this.isConnected = false;
      }
    }
  }

  async write(addr: number, data: number) {
    if (this.adapter) {
      await this.adapter.write(addr, data);
    }
  }

  async read(addr: number) {
    if (this.adapter) {
      await this.adapter.read(addr);
    }
  }

  async load(url: string) {
    const absUrl = this.urlMakeAbsolute(url);
    try {
      const { HardwareClient } = await import(/*@vite-ignore*/ absUrl);
      this.adapter = new HardwareClient(
        this.receivedReadResponse,
        (message: string) => {
          console.log(message);
        },
      );
      this.isLoaded = true;
    } catch {
      this.unload();
    }
  }

  unload() {
    this.disconnect();
    this.adapter = null;
    this.isLoaded = false;
  }

  urlMakeAbsolute(url: string): string {
    return new URL(url, document.baseURI).href;
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
