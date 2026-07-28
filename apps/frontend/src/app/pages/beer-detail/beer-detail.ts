import { Component } from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { BeerService } from '../../services/beer';
import { Beer } from '../../models/beer';


@Component({
  selector: "app-beer-detail",
  imports: [],
  templateUrl: "./beer-detail.html",
  styleUrl: "./beer-detail.css",
})
export class BeerDetail {}
