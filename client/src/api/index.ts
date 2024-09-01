import { Model } from "../models/base";
import { Change, ObjectPool } from "../models/pool";

const BASE_URL = "http://localhost:8080";

export type JsonModel = {
  __class: string;
  id: string;
  lastModifiedDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} & Record<string, any>;

interface LoginResponse {
  token: string;
}

export interface BootstrapData {
  objects: JsonModel[];
  tombstones: { id: string; time: string; modelName: string }[];
}

interface BootstrapApiResponse {
  Objects: JsonModel[];
  Tombstones: { Id: string; Time: string; ModelName: string }[];
}

export interface ApiIface {
  login(username: string, password: string): Promise<void>;
  bootstrap(): Promise<BootstrapData>;
  deltaBootstrap(start: Date): Promise<BootstrapData>;
  change(data: Change): Promise<Model>;
  setupSync(client: ObjectPool): void;
}

class ApiClient implements ApiIface {
  private token: string | null = null;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // TODO: Figure out when to do this.
  async login(username: string, password: string): Promise<void> {
    const response = await this.request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.token = response.token;
  }

  async bootstrap(): Promise<BootstrapData> {
    try {
      const resp = await this.request<BootstrapApiResponse>("/bootstrap");
      return {
        objects: resp.Objects,
        tombstones: resp.Tombstones.map((t) => ({
          id: t.Id,
          time: t.Time,
          modelName: t.ModelName,
        })),
      };
    } catch (e) {
      console.error(e);
      return { objects: [], tombstones: [] };
    }
  }

  async deltaBootstrap(start: Date): Promise<BootstrapData> {
    start.setSeconds(start.getSeconds() + 1);
    try {
      const resp = await this.request<BootstrapApiResponse>(
        `/delta-bootstrap?start_time=${encodeURIComponent(start.toISOString())}`,
      );
      return {
        objects: resp.Objects,
        tombstones: resp.Tombstones.map((t) => ({
          id: t.Id,
          time: t.Time,
          __class: t.ModelName,
        })),
      };
    } catch (e) {
      console.error(e);
      return { objects: [], tombstones: [] };
    }
  }

  async change(data: Change): Promise<Model> {
    return await this.request<Model>("/change", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  setupSync(client: ObjectPool) {
    // TODO: Support local caching of the token
    // if (!this.token) {
    //     throw new Error("Not authenticated");
    // }
    try {
      const ws = new WebSocket(`ws://localhost:8080/sync`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ token: this.token }));
      };
      ws.onmessage = (event) => {
        client?.addServerChange(JSON.parse(event.data));
      };
    } catch (e) {
      console.error(e);
    }
  }
}

export const mainApi = new ApiClient();
