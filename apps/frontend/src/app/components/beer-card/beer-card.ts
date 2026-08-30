import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Beer } from '../../models/beer';

@Component({
  selector: 'app-beer-card',
  imports: [RouterLink],
  templateUrl: './beer-card.html',
  styleUrl: './beer-card.css',
})
export class BeerCard {
  @Input({ required: true }) beer!: Beer;
}