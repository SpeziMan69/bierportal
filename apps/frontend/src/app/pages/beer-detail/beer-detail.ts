import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BeerService } from '../../services/beer';
import type { Beer } from '../../models/beer';

@Component({
  selector: 'app-beer-detail',
  imports: [RouterLink],
  templateUrl: './beer-detail.html',
  styleUrl: './beer-detail.css',
})
export class BeerDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly beerService = inject(BeerService);

  protected readonly beer: Beer | undefined;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.beer = this.beerService.getBeerById(id);
  }
}