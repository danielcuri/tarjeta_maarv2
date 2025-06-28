import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { VersionService } from '../services/version.service';

export const versionGuard: CanMatchFn = () => {
  const versionService = inject(VersionService);
  return versionService.checkCurrentVersion(); // puede ser boolean, Promise o Observable
};
