var R = Object.defineProperty;
var C = (r, e, t) => e in r ? R(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var i = (r, e, t) => (C(r, typeof e != "symbol" ? e + "" : e, t), t);
function m(r) {
  const e = w(r), t = r.addr.toString(16).padStart(8, "0");
  switch (r.command) {
    case "Read": {
      const n = { command: r.command, addr: t, bytes: e };
      return JSON.stringify(n).replaceAll(",", ", ");
    }
    case "Write": {
      const n = r.data.toString(16).padStart(8, "0"), s = {
        command: r.command,
        addr: t,
        data: n,
        bytes: e
      };
      return JSON.stringify(s).replaceAll(",", ", ");
    }
  }
}
function f(r) {
  const e = w(r);
  switch (r.command) {
    case "Read": {
      const t = r.data.toString(16).padStart(8, "0"), n = { command: r.command, data: t, bytes: e };
      return JSON.stringify(n).replaceAll(",", ", ");
    }
    case "Write": {
      const t = { command: r.command, bytes: e };
      return JSON.stringify(t).replaceAll(",", ", ");
    }
  }
}
function w(r) {
  return r.bytes !== void 0 ? Array.from(r.bytes).map((t) => t.toString(16).padStart(2, "0")).join(" ") : "";
}
const u = 71;
function p(r) {
  switch (r) {
    case 48:
      return "Read";
    case 80:
      return "Write";
    default:
      return null;
  }
}
function _(r) {
  switch (r) {
    case "Read":
      return 48;
    case "Write":
      return 80;
  }
}
function g(r) {
  switch (r) {
    case "Read":
      return 7;
    case "Write":
      return 11;
  }
}
function b(r) {
  switch (r) {
    case "Read":
      return 7;
    case "Write":
      return 3;
  }
}
const A = 71, S = 141, h = 8, k = 255;
function y(r) {
  let e = A;
  for (const t of r.values())
    for (let n = h - 1; n >= 0; n--) {
      const s = t >> n & 1, o = e >> h - 1 ^ s;
      e = e << 1 & k, o && (e ^= S);
    }
  return e;
}
class x {
  encode(e) {
    const t = g(e.command), n = new Uint8Array(t);
    let s = 0;
    n[s++] = u, n[s++] = _(e.command);
    const c = new Uint32Array([e.addr]).buffer, o = new DataView(c);
    for (let a = 0; a < 4; a++)
      n[s++] = o.getUint8(3 - a);
    if (e.command === "Write") {
      const a = new Uint32Array([e.data]).buffer, d = new DataView(a);
      for (let l = 0; l < 4; l++)
        n[s++] = d.getUint8(3 - l);
    }
    return n[s++] = y(n.slice(0, t - 1)), n;
  }
}
class U {
  constructor() {
    i(this, "bytes");
    this.bytes = [];
  }
  transform(e, t) {
    this.accumulate_bytes(e);
    const [n, s] = this.parse_responses(this.bytes);
    if (Array.isArray(s)) {
      const c = s;
      for (const o of c)
        t.enqueue(o);
    }
    this.bytes = n;
  }
  accumulate_bytes(e) {
    for (const t of e)
      this.bytes.push(t);
  }
  parse_responses(e) {
    const t = [];
    let n = !1;
    do {
      n = !1;
      const [s, c] = this.parse_response(e);
      if (typeof c == "object") {
        const o = c;
        t.push(o), n = !0;
      }
      e = s;
    } while (n);
    return [e, t];
  }
  parse_response(e) {
    const t = e.indexOf(u);
    if (t >= 0) {
      const n = t + 1;
      if (e.length > n) {
        const s = e[n], c = p(s);
        if (c) {
          const o = b(c);
          if (e.length >= t + o) {
            const a = t + o, d = e.slice(t, a), l = this.parse_response_bounded(
              c,
              d
            );
            return [e.slice(a), l];
          } else
            return [e, "Incomplete"];
        } else
          return [e.slice(n + 1), "Bad"];
      } else
        return [e, "Incomplete"];
    } else
      return [e, "None"];
  }
  parse_response_bounded(e, t) {
    switch (e) {
      case "Read": {
        const n = new Uint8Array(t).buffer, c = new DataView(n).getUint32(2, !1);
        return {
          command: e,
          data: c,
          crc: t[6],
          bytes: new Uint8Array(t)
        };
      }
      case "Write":
        return {
          command: e,
          crc: t[2],
          bytes: new Uint8Array(t)
        };
    }
  }
}
const M = class {
  constructor({ accessCallback: e, logCallback: t }) {
    i(this, "name", "Register Explorer UART");
    i(this, "description", "Client for the Register Explorer UART protocol");
    i(this, "connection");
    i(this, "encoder");
    i(this, "logCallback");
    i(this, "accessCallback");
    this.connection = null, this.logCallback = t, this.accessCallback = e, this.encoder = new x();
  }
  async connect() {
    const e = await navigator.serial.requestPort();
    if (await e.open({
      baudRate: 115200,
      parity: "odd"
    }), !e.readable || !e.writable)
      return;
    const t = new TransformStream(new U()), n = e.readable.pipeTo(t.writable), s = t.readable.getReader(), c = e.writable.getWriter();
    this.connection = {
      port: e,
      reader: s,
      readerClosed: n,
      writer: c,
      decoder: t
    }, this.log("Connected");
  }
  async disconnect() {
    this.connection && (this.connection.writer.releaseLock(), await this.connection.reader.cancel().catch(() => {
    }), await this.connection.readerClosed.catch(() => {
    }), await this.connection.port.close(), this.connection = null, this.log("Disconnected"));
  }
  async write(e, t) {
    await this.writeRequest({
      command: "Write",
      addr: e,
      data: t,
      crc: 0
    });
    try {
      if ((await this.readResponse()).command == "Write")
        this.accessCallback && this.accessCallback({
          type: "Write",
          addr: e,
          data: t
        });
      else
        throw "invalid";
    } catch {
    }
  }
  async read(e) {
    await this.writeRequest({
      command: "Read",
      addr: e,
      crc: 0
    });
    try {
      const t = await this.readResponse();
      if (t.command === "Read")
        return this.accessCallback && this.accessCallback({
          type: "Read",
          addr: e,
          data: t.data
        }), t.data;
      throw "invalid";
    } catch (t) {
      throw t;
    }
  }
  async writeRequest(e) {
    e.bytes = this.encoder.encode(e), this.log("Request " + m(e)), this.connection && this.connection.writer.write(e.bytes);
  }
  async readResponse() {
    try {
      return await Promise.race([
        this.readResponseWithoutTimeout(),
        this.responseTimeout(1e3)
      ]);
    } catch (e) {
      throw this.connection && await this.connection.reader.cancel().catch(() => {
      }), this.log(e.message), e;
    }
  }
  async responseTimeout(e) {
    return new Promise((t, n) => {
      setTimeout(() => n(new Error("Timeout waiting for response")), e);
    });
  }
  async readResponseWithoutTimeout() {
    if (!this.connection)
      throw new Error("Attempt to read a response without a connection");
    const { value: e, done: t } = await this.connection.reader.read();
    if (t)
      throw this.connection.reader.releaseLock(), new Error("No response");
    const n = e;
    return this.log("Response " + f(n)), n;
  }
  log(e) {
    this.logCallback ? this.logCallback(e) : console.log(e);
  }
};
class W {
  constructor() {
    i(this, "bytes");
    this.bytes = [];
  }
  transform(e, t) {
    this.accumulate_bytes(e);
    const [n, s] = this.parse_requests(this.bytes);
    if (Array.isArray(s)) {
      const c = s;
      for (const o of c)
        t.enqueue(o);
    }
    this.bytes = n;
  }
  accumulate_bytes(e) {
    for (const t of e)
      this.bytes.push(t);
  }
  parse_requests(e) {
    const t = [];
    let n = !1;
    do {
      n = !1;
      const [s, c] = this.parse_request(e);
      if (typeof c == "object") {
        const o = c;
        t.push(o), n = !0;
      }
      e = s;
    } while (n);
    return [e, t];
  }
  parse_request(e) {
    const t = e.indexOf(u);
    if (t >= 0) {
      const n = t + 1;
      if (e.length > n) {
        const s = e[n], c = p(s);
        if (c) {
          const o = g(c);
          if (e.length >= t + o) {
            const a = t + o, d = e.slice(t, a), l = this.parse_request_bounded(c, d);
            return [e.slice(a), l];
          } else
            return [e, "Incomplete"];
        } else
          return [e.slice(n + 1), "Bad"];
      } else
        return [e, "Incomplete"];
    } else
      return [e, "None"];
  }
  parse_request_bounded(e, t) {
    const n = new Uint8Array(t).buffer, s = new DataView(n), c = s.getUint32(2, !1);
    switch (e) {
      case "Read":
        return {
          command: e,
          addr: c,
          crc: t[6],
          bytes: new Uint8Array(t)
        };
      case "Write": {
        const o = s.getUint32(6, !1);
        return {
          command: e,
          addr: c,
          data: o,
          crc: t[10],
          bytes: new Uint8Array(t)
        };
      }
    }
  }
}
class v {
  encode(e) {
    const t = b(e.command), n = new Uint8Array(t);
    let s = 0;
    if (n[s++] = u, n[s++] = _(e.command), e.command === "Read") {
      const c = new Uint32Array([e.data]).buffer, o = new DataView(c);
      for (let a = 0; a < 4; a++)
        n[s++] = o.getUint8(3 - a);
    }
    return n[s++] = y(n.slice(0, t - 1)), n;
  }
}
class E {
  constructor(e, t) {
    i(this, "connection");
    i(this, "encoder");
    i(this, "logger");
    i(this, "updateMemCallback");
    i(this, "mem");
    this.connection = null, this.logger = e, this.updateMemCallback = t, this.encoder = new v(), this.mem = /* @__PURE__ */ new Map();
  }
  async connect() {
    const e = await navigator.serial.requestPort();
    if (await e.open({
      baudRate: 115200,
      parity: "odd"
    }), !e.readable || !e.writable)
      return;
    const t = new TransformStream(new W()), n = e.readable.pipeTo(t.writable), s = t.readable.getReader(), c = e.writable.getWriter();
    this.connection = {
      port: e,
      reader: s,
      readerClosed: n,
      writer: c,
      decoder: t
    }, this.log("Connected");
  }
  async listen() {
    if (this.connection)
      for (; this.connection.port.readable; ) {
        const e = await this.connection.reader.read();
        if (e.done)
          return;
        const t = e.value;
        switch (this.log(m(t)), t.command) {
          case "Write":
            this.mem.set(t.addr, t.data), this.updateMemString(this.mem), await this.send_response(this.encoder, this.connection.writer, {
              command: "Write",
              crc: 0
            });
            break;
          case "Read":
            const n = this.getMemEntry(t.addr);
            await this.send_response(this.encoder, this.connection.writer, {
              command: "Read",
              data: n,
              crc: 0
            });
            break;
        }
      }
  }
  async disconnect() {
    this.connection && (this.connection.writer.releaseLock(), await this.connection.reader.cancel().catch(() => {
    }), await this.connection.readerClosed.catch(() => {
    }), await this.connection.port.close(), this.connection = null, this.log("Disconnected"));
  }
  async send_response(e, t, n) {
    n.bytes = e.encode(n), this.log(f(n)), await t.write(n.bytes);
  }
  log(e) {
    this.logger && this.logger(e);
  }
  getMemEntry(e) {
    return this.mem.has(e) ? this.mem.get(e) || 0 : Math.floor(Math.random() * 4294967295);
  }
  updateMemString(e) {
    if (!this.updateMemCallback)
      return;
    const t = Array.from(e.entries()).map(([n, s]) => n.toString(16).padStart(8, "0") + ":" + s.toString(16).padStart(8, "0")).join(`
`);
    this.updateMemCallback(t);
  }
}
export {
  M as Client,
  M as HardwareAdapter,
  E as ServerModel
};
//# sourceMappingURL=register-explorer.js.map
