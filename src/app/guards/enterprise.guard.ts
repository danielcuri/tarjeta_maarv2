import { inject } from '@angular/core';
import { CanMatchFn, CanActivateFn } from '@angular/router';
import { RecordService } from '../services/record.service';

export const enterpriseGuardCanMatch: CanMatchFn = () => {
  const rs = inject(RecordService);
  return rs.checkPreSelect(); // puede retornar boolean, Promise o Observable
};

export const enterpriseGuardCanActivate: CanActivateFn = () => {
  const rs = inject(RecordService);
  return rs.checkPreSelect();
};
