import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Beer } from '../../models/beer';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';

@Component({
  selector: 'app-beer-card',
  imports: [RouterLink, MediaUrlPipe],
  templateUrl: './beer-card.html',
  styleUrl: './beer-card.css',
})
export class BeerCard {
  @Input({ required: true }) beer!: Beer;
}
