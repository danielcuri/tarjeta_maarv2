import { inject } from '@angular/core';
import { CanMatchFn, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

// Reemplaza a CanLoad
export const authGuardCanMatch: CanMatchFn = () => {
  const userService = inject(UserService);
  return userService.checkUser();
};

// Reemplaza a CanActivate
export const authGuardCanActivate: CanActivateFn = () => {
  const userService = inject(UserService);
  return userService.checkUser();
};
