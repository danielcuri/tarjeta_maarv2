import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuardCanMatch } from './guards/auth.guard';
import { versionGuard } from './guards/version.guard';
const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  {
    path: 'main',
    loadChildren: () =>
      import('./pages/main/main.module').then((m) => m.MainPageModule),
    canMatch: [authGuardCanMatch], // ✅ moderno, reemplaza a canLoad
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginPageModule),
    canMatch: [versionGuard],
  },
  {
    path: 'terms',
    loadChildren: () =>
      import('./pages/terms/terms.module').then((m) => m.TermsPageModule),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'register',
    loadChildren: () =>
      import('./pages/register/register.module').then(
        (m) => m.RegisterPageModule
      ),
    canMatch: [versionGuard],
  },
  {
    path: 'update-app',
    loadChildren: () =>
      import('./pages/update-app/update-app.module').then(
        (m) => m.UpdateAppPageModule
      ),
  },
  {
    path: 'record',
    loadChildren: () =>
      import('./pages/record/record.module').then((m) => m.RecordPageModule),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./pages/profile/profile.module').then((m) => m.ProfilePageModule),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'recover-pass',
    loadChildren: () =>
      import('./pages/recover-pass/recover-pass.module').then(
        (m) => m.RecoverPassPageModule
      ),
    canMatch: [versionGuard],
  },
  {
    path: 'change-password',
    loadChildren: () =>
      import('./pages/change-password/change-password.module').then(
        (m) => m.ChangePasswordPageModule
      ),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'activate-user',
    loadChildren: () =>
      import('./pages/activate-user/activate-user.module').then(
        (m) => m.ActivateUserPageModule
      ),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'activate-user-code',
    loadChildren: () =>
      import('./pages/activate-user-code/activate-user-code.module').then(
        (m) => m.ActivateUserCodePageModule
      ),
    canMatch: [versionGuard, authGuardCanMatch],
  },
  {
    path: 'pre-main',
    loadChildren: () => import('./pages/pre-main/pre-main.module').then( m => m.PreMainPageModule)
  },
  {
    path: 'tarjeta-main',
    loadChildren: () => import('./pages/tarjeta-main/tarjeta-main.module').then( m => m.TarjetaMainPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
