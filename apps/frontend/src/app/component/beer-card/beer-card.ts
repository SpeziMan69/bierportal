import { Component, Input } from '@angular/core';
import type { Beer } from '../../models/beer';

@Component({
  selector: 'app-beer-card',
  imports: [],
  templateUrl: './beer-card.html',
  styleUrl: './beer-card.css'
})
export class BeerCard {
  @Input() beer!: Beer;
}
