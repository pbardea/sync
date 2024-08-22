import { Change, ServerUpdate, ApiTestingPool, ObjectPool } from "../models/pool";

const BASE_URL = 'http://localhost:8080';

export type JsonModel = { __class: string; id: string, lastModifiedDate: string } & Record<string, any>;

interface LoginResponse {
  token: string;
}

interface BootstrapData {
  objects: JsonModel[];
}

export class MockApi implements ApiIface {
  pool?: ApiTestingPool;
  messagesToSend: ServerUpdate[] = [];

  async login(_username: string, _password: string): Promise<void> { }
  async bootstrap(): Promise<BootstrapData> {
    return {
      objects: [
        {
          id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
          name: "Paul Bardea",
          teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
          lastModifiedDate: (new Date()).toISOString(),
          __class: "User",
        },
        {
          id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
          name: "Paul",
          email: "paul@pbardea.com",
          teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
          lastModifiedDate: (new Date()).toISOString(),
          __class: "User",
        },
        {
          id: "279592c1-2334-430b-b97f-a8f9265d4805",
          name: "Team A",
          lastModifiedDate: (new Date()).toISOString(),
          __class: "Team",
        },
        {
          id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
          name: "Orphan",
          email: "paul@pbardea.com",
          lastModifiedDate: (new Date()).toISOString(),
          __class: "User",
        },
      ]
    }
  }

  async change(change: Change): Promise<void> {
    if (!this.pool) {
      this.pool = ApiTestingPool.getInstance();
    }
    this.pool.apply(change);
    const changedRecord = this.pool.get(change.modelId).getJson();
    // Indicate that this is the latest change the server has seen.
    changedRecord.lastModifiedDate = (new Date()).toISOString();
    this.messagesToSend.push({ type: change.type, jsonObject: changedRecord });
    // Accept the change and transform it as a message to send on the queue.
    // TODO: Create a copy of the pool and maintain one server side?
    // Then you can call apply()? Or maybe just move the apply defn here?
    // Keep the state in memory and then apply changes. Get the record that
    // we changed and then send that record to the 
  }

  #clients: ObjectPool[] = [];
  setupSync(client: ObjectPool): void {
    this.#clients.push(client);
  }

  // Test helper: Runs the websocket server until drained.
  async runWorker(): Promise<void> {
    for (const message of this.messagesToSend) {
      for (const client of this.#clients) {
        client.applyServerUpdate(message);
      }
    }
  }
}

export interface ApiIface {
  login(username: string, password: string): Promise<void>
  bootstrap(): Promise<BootstrapData>;
  change(data: Change): Promise<void>;
  setupSync(client: ObjectPool): void;
}

class ApiClient implements ApiIface {
  private token: string | null = null;

  private async request<T>(_endpoint: string, _options: RequestInit = {}): Promise<T> {
    // const url = `${BASE_URL}${endpoint}`;
    // const headers = {
    //   'Content-Type': 'application/json',
    //   ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    //   ...options.headers,
    // };

    // const response = await fetch(url, { ...options, headers });
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    // return response.json();
    return new Promise((resolve, _reject) => resolve({} as T));
  }

  // TODO: Figure out when to do this.
  async login(username: string, password: string): Promise<void> {
    const response = await this.request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.token = response.token;
  }

  async bootstrap(): Promise<BootstrapData> {
    return this.request<BootstrapData>('/bootstrap');
  }

  async change(data: Change): Promise<void> {
    await this.request('/change', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  setupSync(onMessage: (data: any) => void): WebSocket {
    if (!this.token) {
      throw new Error('Not authenticated');
    }
    const ws = new WebSocket(`ws://localhost:8080/sync`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ token: this.token }));
    };
    ws.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };
    return ws;
  }
}

// export const api = new ApiClient();
export const mockApi = new MockApi();

