import { inject } from '@angular/core';
import { CanMatchFn, CanActivateFn } from '@angular/router';
import { UserService } from '../services/user.service';

// Reemplaza a CanLoad
export const activateUserGuardCanMatch: CanMatchFn = () => {
  const us = inject(UserService);
  return us.checkUserStatus();
};

// Reemplaza a CanActivate
export const activateUserGuardCanActivate: CanActivateFn = () => {
  const us = inject(UserService);
  return us.checkUserStatus();
};
