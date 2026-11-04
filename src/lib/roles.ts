// Must stay in sync with BusPointBackend/src/common/enums/role.enum.ts
export enum Role {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  DRIVER = 'driver',
  PARENT = 'parent',
}

// Redirect map — where each role lands after login
export const ROLE_REDIRECT: Record<Role, string> = {
  [Role.SUPER_ADMIN]:  '/super-admin/dashboard',
  [Role.SCHOOL_ADMIN]: '/dashboard',
  [Role.DRIVER]:       '/',
  [Role.PARENT]:       '/',
};
