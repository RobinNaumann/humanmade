import { ApiClient } from "donau/client";

const apiPort = import.meta.env.VITE_API_PORT ?? null;

class APIService {
  private _api = new ApiClient({
    port: apiPort ? Number(apiPort) : undefined,
  });

  getHello(name: string): Promise<string> {
    return this._api.get("/hello", { query: { name } });
  }
}

export const apiService = new APIService();
