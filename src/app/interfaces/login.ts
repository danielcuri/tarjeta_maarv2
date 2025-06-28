export interface UserAnswer {
    error: boolean;
    type: number;
    user?: User;
    msgs?: any;
    code?: number;
    message?: string;
    data?: {
      code?: string;
      [key: string]: any;
    };
}

export interface User {
    id:number;
    name: string;
    email: string;
    status: Number;
    access_token: string;
    expires_at: string;
    roles: Role[]
}

export interface Role {
    id: Number,
    name: string;
    code: string;
    pivot: RolePivot
}

export interface RolePivot {
    role_id: string;
    user_id: string;
}
