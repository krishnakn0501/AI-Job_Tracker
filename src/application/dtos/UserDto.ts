// src/application/dtos/UserDto.ts

export interface UserDto {
  id: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  theme: "light" | "dark";
  username?: string;
  dob?: string;
  country: string;
  mobile?: string;
  pendingEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileInput {
  theme?: "light" | "dark";
  username?: string;
  dob?: string;
  country?: string;
  mobile?: string;
}