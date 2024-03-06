import { useStore } from 'src/store'
import bigInt from "big-integer";
import { Bit } from "src/types";
import { stringToBitArray } from "src/parse";
import { valueToFields } from 'src/format'

export interface ReadResponseEvent {
  addr: bigInt.BigInteger;
  data: Bit[];
}

export function receivedReadResponse(addr: number, data: number) {
  const message = "receivedReadResponse:0x" + addr.toString(16).padStart(8, "0") + ":0x" + data.toString(16).padStart(8, "0");
  console.log(message);

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
