export type MockOffer = {
  title: string;
  description: string;
  city: string;
  previewImage: string;
  images: string[];
  type: string;
  amenities: string[];
  author: string;
  latitude: number;
  longitude: number;
};

export type MockData = {
  offers: MockOffer[];
};
