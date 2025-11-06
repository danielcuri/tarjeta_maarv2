import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  IonInfiniteScroll,
} from '@ionic/angular';
import { RecordService } from 'src/app/services/record.service';
import { UserService } from 'src/app/services/user.service';

interface FileType {
  id: number;
  name: string;
}

@Component({
  selector: 'app-documents-main',
  templateUrl: './documents-main.page.html',
  styleUrls: ['./documents-main.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class DocumentsMainPage implements OnInit {
  // Filtros
  // ion-datetime retorna ISO 8601; lo convertimos a inicio/fin del día en ISO
  fechaInicio: string | null = null;   // ISO string o null
  fechaFin: string | null = null;      // ISO string o null
  selectedTypeId: number | '' = '';
  searchText = '';

  // Datos
  filetypes: FileType[] = [];
  docs: any[] = [];

  // Paginación
  page = 1;
  limit = 20; // 20 por página
  hasMore = true;
  loading = false;

  @ViewChild(IonInfiniteScroll) infinite?: IonInfiniteScroll;

  constructor(
    public rs: RecordService,
    public us: UserService,
  ) {}

  ngOnInit() {
    this.loadTypes();
    this.fetch(true);
  }

  // === UI helpers ===
  trackById = (_: number, it: any) => it?.id;

  // === Cargar tipos de archivo ===
  private loadTypes() {
    this.rs.getFiletypes({
      page: 1,
      limit: 100,
      sort: 'name',
      order: 'asc',
      filter: JSON.stringify([]),
    })
    .subscribe((res: any) => {
      const data = res?.data?.rows ?? res?.rows ?? [];
      this.filetypes = data;
    });
  }

  // Helpers fecha -> ISO inicio/fin de día
  private startOfDayISO(d: string | Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString();
  }
  private endOfDayISO(d: string | Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.toISOString();
  }

  // === Construir filtros para el backend ===
  private buildFilterArray() {
    const f: any[] = [];

    // Tipo de archivo
    if (this.selectedTypeId !== '' && this.selectedTypeId !== null) {
      f.push({
        keyContains: 'filetypeId',
        key: 'equals',
        value: Number(this.selectedTypeId),
      });
    }

    // Fechas (created_at) en ISO VÁLIDO
    if (this.fechaInicio) {
      f.push({
        keyContains: 'created_at',
        key: 'gte',
        value: this.startOfDayISO(this.fechaInicio),
      });
    }
    if (this.fechaFin) {
      f.push({
        keyContains: 'created_at',
        key: 'lte',
        value: this.endOfDayISO(this.fechaFin),
      });
    }

    // Texto (por nombre). Si tu helper soporta OR, luego añadimos description.
    if (this.searchText?.trim()) {
      f.push({
        keyContains: 'name',
        key: 'contains',
        value: this.searchText.trim(),
      });
    }

    return f;
  }

  // === Pedir documentos ===
  private fetch(reset = false) {
    if (this.loading) return;
    this.loading = true;

    if (reset) {
      this.page = 1;
      this.hasMore = true;
      this.docs = [];
      if (this.infinite?.disabled) this.infinite.disabled = false;
    }

    const params = {
      page: this.page,
      limit: this.limit,
      sort: 'created_at',   // últimos por fecha de creación
      order: 'desc',
      filter: JSON.stringify(this.buildFilterArray()),
    };

    this.rs.getFiles(params).subscribe({
      next: (res: any) => {
        const rows = res?.data?.rows ?? res?.rows ?? [];
        const meta = res?.data?.responseFilter ?? res?.responseFilter;

        this.docs = reset ? rows : [...this.docs, ...rows];

        if (meta) {
          const totalPages = Number(meta.total_pages ?? 0);
          this.hasMore = this.page < totalPages;
          if (!this.hasMore && this.infinite) {
            this.infinite.complete().then(() => (this.infinite!.disabled = true));
          }
        } else {
          this.hasMore = rows.length === this.limit;
          if (!this.hasMore && this.infinite) {
            this.infinite.complete().then(() => (this.infinite!.disabled = true));
          }
        }
      },
      error: _ => {},
      complete: () => { this.loading = false; },
    });
  }

  // Botón Buscar
  applyFilters(reset = true) {
    // Reiniciamos estado y delegamos a fetch(), que ya arma filter en ISO
    if (reset) {
      this.page = 1;
      this.docs = [];
      this.hasMore = true;
      if (this.infinite?.disabled) this.infinite.disabled = false;
    }
    this.fetch(true);
  }

  // Infinite scroll
  loadMore(ev: any) {
    if (!this.hasMore || this.loading) {
      ev?.target?.complete();
      return;
    }
    this.page++;
    const params = {
      page: this.page,
      limit: this.limit,
      sort: 'created_at',
      order: 'desc',
      filter: JSON.stringify(this.buildFilterArray()),
    };
    this.rs.getFiles(params).subscribe({
      next: (res: any) => {
        const rows = res?.data?.rows ?? res?.rows ?? [];
        const meta = res?.data?.responseFilter ?? res?.responseFilter;

        this.docs = [...this.docs, ...rows];

        if (meta) {
          const totalPages = Number(meta.total_pages ?? 0);
          this.hasMore = this.page < totalPages;
        } else {
          this.hasMore = rows.length === this.limit;
        }
      },
      complete: () => ev?.target?.complete(),
    });
  }

  // Descargar / Ver
  download(f: any) {
    window.open(f.url_file, '_blank');
  }
}
