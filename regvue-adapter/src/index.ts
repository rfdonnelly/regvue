type AccessCallback = (access: Access) => void;
type LogCallback = (message: string) => void;

interface Access {
  type: "Read" | "Write";
  addr: number;
  data: number;
}

interface AdapterConstructorParams {
  accessCallback?: AccessCallback,
  logCallback?: LogCallback,
}

interface AdapterConstructor {
  new (params: AdapterConstructorParams): Adapter;
}

interface Adapter {
  name: string;
  description: string;

  // Called for every detected access (solicited or unsolicited).
  accessCallback?: AccessCallback;

  // Connect to the hardware
  connect(): Promise<void>;

  // Disconnect from the hardware
  disconnect(): Promise<void>;

  // Perform a write
  write(addr: number, data: number): Promise<void>;

  // Perform a read
  read(addr: number): Promise<number>;
}

export {
  type AccessCallback,
  type LogCallback,
  type Access,
  type Adapter,
  type AdapterConstructor,
  type AdapterConstructorParams,
};
