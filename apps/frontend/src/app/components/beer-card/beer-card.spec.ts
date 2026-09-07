import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { BeerCard } from "./beer-card";

describe("BeerCard", () => {
  let component: BeerCard;
  let fixture: ComponentFixture<BeerCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeerCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
