import { Injectable } from '@angular/core';
import { Beer } from '../models/beer';

@Injectable({
  providedIn: 'root'
})
export class BeerService {
  private beers: Beer[] = [
    {
      id: 1,
      name: 'Guinness Draught',
      brewery: 'Guinness',
      country: 'Irland',
      type: 'Stout',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'assets/beer-placeholder.jpg',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 2,
      name: 'Paulaner Bier',
      brewery: 'Paulaner',
      country: 'Deutschland',
      type: 'Pils',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'assets/beer-placeholder.jpg',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 3,
      name: 'Heineken',
      brewery: 'Heineken',
      country: 'Niederlande',
      type: 'Pils',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'placeholder',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 4,
      name: 'Schönbuchbräu',
      brewery: 'Schönbuchbräu',
      country: 'Deutschland',
      type: 'Pils', 
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'placeholder',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 5,
      name: 'Guinness Draught',
      brewery: 'Guinness',
      country: 'Irland',
      type: 'Stout',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'assets/beer-placeholder.jpg',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 6,
      name: 'Paulaner Bier',
      brewery: 'Paulaner',
      country: 'Deutschland',
      type: 'Pils',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'assets/beer-placeholder.jpg',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 7,
      name: 'Heineken',
      brewery: 'Heineken',
      country: 'Niederlande',
      type: 'Pilsng',
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'placeholder',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    },
    {
      id: 8,
      name: 'Schönbuchbräu',
      brewery: 'Schönbuchbräu',
      country: 'Deutschland',
      type: 'Pils', 
      alcohol: 4.2,
      rating: 4.7,
      imageUrl: 'placeholder',
      description: 'Ein dunkles, cremiges Stout mit Röstnoten.'
    }
  ];

  getBeers(): Beer[] {
    return this.beers;
  }

  getBeerById(id: number): Beer | undefined {
    return this.beers.find(beer => beer.id === id);
  }
}