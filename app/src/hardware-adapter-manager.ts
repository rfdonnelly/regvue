import { useStore } from 'src/store'
import bigInt from "big-integer";
import { Bit } from "src/types";
import { stringToBitArray } from "src/parse";
import { valueToFields } from 'src/format'
import { Access, Adapter } from 'regvue-adapter';

export interface ReadAccess {
  addr: bigInt.BigInteger;
  data: Bit[];
}

export class HardwareAdapterManager {
  adapter: Adapter | null;
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
      const { HardwareAdapter } = await import(/*@vite-ignore*/ absUrl);
      this.adapter = new HardwareAdapter({accessCallback: this.accessCallback});
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

  accessCallback(access: Access) {
    if (access.type != "Read") return;

    const store = useStore();
    const readAccess: ReadAccess = {
      addr: bigInt(access.addr),
      data: stringToBitArray("0x" + access.data.toString(16)),
    };
    const element = store.findRegByAddr(readAccess.addr);
    if (element && element.fields) {
      valueToFields(store.swap, readAccess.data, element.fields);
    }

    store.lastReadAccess = readAccess;
  }
}
