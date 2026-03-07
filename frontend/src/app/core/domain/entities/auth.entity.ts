export interface AuthUser {
  user_id: number;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  full_name?: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
  message: string;
}
