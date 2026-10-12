import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { CounterService } from '../services/counter.service';

type SortMode = 'newest' | 'name' | 'value';
type ValueFilter = 'all' | 'positive' | 'negative';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    DatePipe,
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class Tab2Page implements OnInit {
  readonly valueFilter = signal<ValueFilter>('all');

  onValueFilterChange(event: CustomEvent): void {
    this.valueFilter.set(event.detail.value as ValueFilter);
  }

  readonly counterService = inject(CounterService);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  readonly searchTerm = signal('');
  readonly sortMode = signal<SortMode>('newest');

  // soucet vsech hodnot
  readonly total = computed(() =>
    this.counterService.counters().reduce((sum, c) => sum + c.value, 0),
  );

  // razeni a vyhledavani
  readonly visibleCounters = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const valueFilter = this.valueFilter();

    const filtered = this.counterService
      .counters()
      .filter((c) => c.name.toLowerCase().includes(term))
      .filter((c) => {
        switch (valueFilter) {
          case 'positive':
            return c.value > 0;
          case 'negative':
            return c.value < 0;
          default:
            return true;
        }
      });

    switch (this.sortMode()) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
      case 'value':
        return filtered.sort((a, b) => b.value - a.value);
      default:
        return filtered;
    }
});

  async ngOnInit(): Promise<void> {
    await this.counterService.initialize();
  }

  onSearch(event: CustomEvent): void {
    this.searchTerm.set((event.detail.value as string | null | undefined) ?? '');
  }

  onSortChange(event: CustomEvent): void {
    this.sortMode.set(event.detail.value as SortMode);
  }

  async remove(id: string): Promise<void> {
    await this.counterService.remove(id);
    await this.showToast('Záznam byl odstraněn.');
  }

  // potrvzeni pred smazanim hostorie
  async confirmClear(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Vymazat historii?',
      message: 'Všechny uložené záznamy budou odstraněny.',
      buttons: [
        { text: 'Zrušit', role: 'cancel' },
        {
          text: 'Vymazat',
          role: 'destructive',
          handler: async () => {
            await this.counterService.clear();
            await this.showToast('Historie byla vymazána.');
          },
        },
      ],
    });
    await alert.present();
  }

  // ion toast
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}