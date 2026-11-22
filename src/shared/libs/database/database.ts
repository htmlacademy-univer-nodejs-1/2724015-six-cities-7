import { injectable } from 'inversify';
import mongoose from 'mongoose';

@injectable()
export class Database {
  public async connect(uri: string): Promise<void> {
    await mongoose.connect(uri);
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}
