export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, JsonValue>;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: number;
  result: JsonValue;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: number | null;
  error: {
    code: number;
    message: string;
    data?: JsonValue;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

export interface ToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: JsonValue;
}

export interface ToolCallResult {
  content?: JsonValue;
  structuredContent?: JsonValue;
  isError?: boolean;
  [key: string]: JsonValue | undefined;
}
