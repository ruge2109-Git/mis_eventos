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
  searchChange = output<string>();

  searchControl = new FormControl('');
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
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
