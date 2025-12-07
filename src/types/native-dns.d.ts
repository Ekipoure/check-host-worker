declare module 'native-dns' {
  export interface Question {
    name: string;
    type: string | number;
    class?: number;
  }

  export interface Server {
    address: string;
    port: number;
    type: string;
  }

  export interface RequestOptions {
    question: Question;
    server: Server;
    timeout?: number;
  }

  export interface Answer {
    name: string;
    type: number;
    class: number;
    ttl: number;
    address?: string;
  }

  export interface Message {
    answer?: Answer[];
    question?: Question[];
    authority?: any[];
    additional?: any[];
  }

  export interface Request {
    on(event: 'message', handler: (err: any, msg: Message) => void): void;
    on(event: 'timeout', handler: () => void): void;
    on(event: 'error', handler: (err: any) => void): void;
    send(): void;
  }

  export function Question(options: Question): Question;
  export function Request(options: RequestOptions): Request;
}

