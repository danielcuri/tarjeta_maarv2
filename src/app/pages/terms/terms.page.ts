import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
  standalone: false,
})
export class TermsPage implements OnInit {
  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}
  returnBack() {
    this.modalCtrl.dismiss();
  }
}
