import { getRandomItem, getRandomNumber } from '../helpers/random.js';
import { MockData } from '../types/mock-data.type.js';

export const TSV_HEADER = 'title\tdescription\tdate\tcity\tpreviewImage\timages\tisPremium\tisFavorite\trating\ttype\trooms\tguests\tprice\tamenities\tauthor\tlatitude\tlongitude';

export function generateOffer(data: MockData): string {
  const offer = getRandomItem(data.offers);
  const date = new Date();
  date.setDate(date.getDate() - getRandomNumber(0, 7));

  const values = [
    offer.title,
    offer.description,
    date.toISOString(),
    offer.city,
    offer.previewImage,
    offer.images.join(','),
    getRandomNumber(0, 1) === 1,
    false,
    getRandomNumber(10, 50) / 10,
    offer.type,
    getRandomNumber(1, 8),
    getRandomNumber(1, 10),
    getRandomNumber(100, 100000),
    offer.amenities.join(','),
    offer.author,
    offer.latitude,
    offer.longitude,
  ];

  return values.map((value) => String(value).replace(/[\t\r\n]/g, ' ')).join('\t');
}

export function* generateOffers(count: number, data: MockData): Generator<string> {
  yield `${TSV_HEADER}\n`;

  for (let i = 0; i < count; i++) {
    yield `${generateOffer(data)}\n`;
  }
}
