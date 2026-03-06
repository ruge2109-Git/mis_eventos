import { Component, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  placeholder = input<string>('Buscar eventos...');
  search = output<string>();

  searchControl = new FormControl('');
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.subscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(value => {
        this.search.emit(value || '');
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
