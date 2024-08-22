import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

interface LoginResponse {
  token: string;
}

interface BootstrapData {
  // Define the structure of your bootstrap data here
}

class ApiClient {
  private token: string | null = null;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

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

  async change(data: any): Promise<void> {
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

export const api = new ApiClient();