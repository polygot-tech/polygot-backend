declare global {
  namespace Express {
    interface Request {
      monitor?: {
        id: string;
        client_id: string;
        app_id: string;
        is_active: boolean;
        production: boolean;
        api_calls: number;
        origin: string;
      };
    }
  }
}
