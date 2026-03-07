import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { InputComponent } from '@shared/components/input/input.component';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [InputComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  placeholder = input<string>('Buscar eventos...');
  /** Optional: override input styles (e.g. smaller bar for side panels). */
  inputClass = input<string>('');
  searchChange = output<string>();

  protected readonly defaultInputClass =
    'rounded-full py-5 !pl-14 pr-6 text-xl shadow-2xl backdrop-blur-sm bg-surface/40 hover:bg-surface/60 border-none';

  searchControl = new FormControl('');
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.searchChange.emit(value || '');
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
