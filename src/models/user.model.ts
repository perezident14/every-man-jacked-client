export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  ['_id']?: string
  firstName: string
  lastName: string
  email: string
  password?: string
  role?: UserRole
  workouts: string[]
}

export interface PasswordUpdateData {
  oldPassword: string
  newPassword: string
}

export const initialPasswordUpdateData: PasswordUpdateData = {
  oldPassword: '',
  newPassword: '',
}
