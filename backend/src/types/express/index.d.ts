declare global {
  namespace Express {
    interface User {
      _id: string;
      id: string;
      identifier: string;
      fullName: string;
      name: string;
      role: 'user' | 'admin';
      isActive: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};