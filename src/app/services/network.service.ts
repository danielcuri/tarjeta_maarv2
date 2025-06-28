import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private isConnectedSubject: Subject<boolean> = new Subject<boolean>();
  isConnected$ = this.isConnectedSubject.asObservable();

  flag: boolean = true;
  private hasConnectionChanged: boolean = false;

  constructor() {}

  async initializeNetworkEvents() {
    console.log('INICIALIZANDO NETWORK EVENTS');

    /* Network.addListener('networkStatusChange', (status) => {
      const isConnected = status.connected;
      this.isConnectedSubject.next(isConnected);
      this.flag = isConnected;
    }); */

    Network.addListener('networkStatusChange', (status) => {
      const isConnected = status.connected;
      this.isConnectedSubject.next(isConnected);
      if (isConnected !== this.flag) {
        this.hasConnectionChanged = true;
      }
      this.flag = isConnected;
    });
  }

  checkConnection() {
    return this.flag;
  }
  checkConnectionAndResetFlag() {
    const hasChanged = this.hasConnectionChanged;
    this.hasConnectionChanged = false;
    return hasChanged;
  }
}
