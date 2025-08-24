declare global {
  namespace Express {
    interface Request {
      user?: User;
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
