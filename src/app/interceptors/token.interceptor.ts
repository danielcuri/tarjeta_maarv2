import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { User } from '../interfaces/login';
import { UserService } from '../services/user.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    public toastController: ToastController,
    private us: UserService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const user: User = this.us.user;
    const token = user != null ? user.access_token : null;

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: 'Bearer ' + token,
        },
      });
    }

    if (!request.headers.has('Content-Type')) {
      request = request.clone({
        setHeaders: {
          'content-type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    }

    request = request.clone({
      headers: request.headers.set('Accept', 'application/json'),
    });

    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // console.log('event--->>>', event);
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          if (error.error.success === false) {
            this.presentToast(
              'Error al corroborar tu usuario, por favor logueate nuevamente'
            );
          } else {
            this.router.navigate(['login']);
          }
        }
        return throwError(error);
      })
    );
  }

  async presentToast(msg: any) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }
}
