export interface Beer {
  id: string;
  name: string;
  brewery: string;
  country: string;
  type: string;
  alcohol: number | null;
  rating: number | null;
  imageUrl: string;
  description: string;
}
