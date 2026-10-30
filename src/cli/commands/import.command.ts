import { createReadStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { inject, injectable } from 'inversify';
import { Component } from '../../shared/container/component.js';
import { Database } from '../../shared/libs/database/database.interface.js';
import { Logger } from '../../shared/libs/logger/logger.interface.js';
import { UserService } from '../../rest/modules/user/user-service.interface.js';
import { OfferService } from '../../rest/modules/offer/offer-service.interface.js';
import { TSV_HEADER } from '../../shared/generators/offer-generator.js';
import { Command } from '../interfaces/command.interface.js';

@injectable()
export class ImportCommand implements Command {
  public readonly name = 'import';

  constructor(
    @inject(Component.Database) private readonly database: Database,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.Logger) private readonly logger: Logger,
  ) {}

  public async call(args: string[]): Promise<void> {
    const filePath = args[0];

    const uri = args[1];

    if (!filePath || !uri || args.length !== 2) {
      console.error('Укажите путь к файлу: --import <path> <mongodb-uri>');
      process.exitCode = 1;
      return;
    }

    try {
      await this.database.connect(uri);
    } catch (error) {
      this.logger.error((error as Error).message);
      process.exitCode = 1;
      return;
    }

    const stream = createReadStream(filePath, 'utf-8');
    const lines = createInterface({ input: stream, crlfDelay: Infinity });
    let headers: string[] = [];

    let count = 0;

    try {
      for await (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        if (headers.length === 0) {
          if (line !== TSV_HEADER) {
            throw new Error('Неверный заголовок TSV');
          }
          headers = line.split('\t');
          continue;
        }

        const values = line.split('\t');
        const offer: Record<string, string> = {};

        if (values.length !== headers.length) {
          throw new Error('Количество полей не совпадает с заголовком TSV');
        }

        for (let i = 0; i < headers.length; i++) {
          offer[headers[i]] = values[i];
        }

        const email = offer.author.includes('@') ? offer.author : `${offer.author}@example.com`;
        let user = await this.userService.findByEmail(email);

        if (!user) {
          user = await this.userService.create({
            name: offer.author,
            email,
            avatar: '',
            password: randomBytes(24).toString('hex'),
            type: 'regular',
          });
        }

        await this.offerService.create({
          title: offer.title,
          description: offer.description,
          date: new Date(offer.date),
          city: offer.city,
          previewImage: offer.previewImage,
          images: offer.images.split(','),
          isPremium: offer.isPremium === 'true',
          rating: Number(offer.rating),
          type: offer.type,
          rooms: Number(offer.rooms),
          guests: Number(offer.guests),
          price: Number(offer.price),
          amenities: offer.amenities.split(','),
          author: user._id,
          latitude: Number(offer.latitude),
          longitude: Number(offer.longitude),
        });
        count++;
      }
      if (headers.length === 0) {
        throw new Error('TSV-файл пуст');
      }
      this.logger.info(`Импортировано предложений: ${count}`);
    } catch (error) {
      this.logger.error(`Не удалось импортировать файл ${filePath}: ${(error as Error).message}. Сохранено предложений: ${count}`);
      process.exitCode = 1;
    } finally {
      lines.close();
      stream.destroy();
      await this.database.disconnect();
    }
  }
}
