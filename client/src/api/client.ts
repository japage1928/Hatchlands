/**
 * API client for Hatchlands server
 */

import axios, { AxiosInstance } from 'axios';
import { WorldResponse, CaptureAttemptRequest, BreedCreaturesRequest, ListCreatureRequest, PurchaseCreatureRequest } from '@hatchlands/shared';

class HatchlandsAPI {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  // World
  async getWorld(): Promise<WorldResponse> {
    const response = await this.client.get('/world');
    return response.data;
  }

  // Encounters
  async startEncounter(spawnId: string): Promise<any> {
    const response = await this.client.post('/encounter/start', { spawnId });
    return response.data;
  }

  async captureCreature(request: CaptureAttemptRequest): Promise<any> {
    const response = await this.client.post('/encounter/capture', request);
    return response.data;
  }

  async fleeEncounter(encounterId: string, spawnId: string): Promise<any> {
    const response = await this.client.post('/encounter/flee', { encounterId, spawnId });
    return response.data;
  }

  // Breeding
  async startBreeding(request: BreedCreaturesRequest): Promise<any> {
    const response = await this.client.post('/breeding/start', request);
    return response.data;
  }

  async completeBreeding(breedingId: string): Promise<any> {
    const response = await this.client.post('/breeding/complete', { breedingId });
    return response.data;
  }

  // Market
  async listCreature(request: ListCreatureRequest): Promise<any> {
    const response = await this.client.post('/market/list', request);
    return response.data;
  }

  async purchaseCreature(request: PurchaseCreatureRequest): Promise<any> {
    const response = await this.client.post('/market/purchase', request);
    return response.data;
  }

  async cancelListing(listingId: string): Promise<any> {
    const response = await this.client.delete(`/market/listing/${listingId}`);
    return response.data;
  }
}

export const api = new HatchlandsAPI();
