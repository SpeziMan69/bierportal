import { Component } from "@angular/core";
import { BeerService } from "../../services/beer";
import { Beer } from "../../models/beer";
import { BeerCard } from "../../component/beer-card/beer-card";

@Component({
  selector: "app-beer-list",
  imports: [BeerCard],
  templateUrl: "./beer-list.html",
  styleUrl: "./beer-list.css",
})
export class BeerList {
  beers: Beer[] = [];

  constructor(private beerService: BeerService) {
    this.beers = this.beerService.getBeers();
  }
}