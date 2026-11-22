import { ClassConstructor, plainToInstance } from 'class-transformer';

export function toResponse<T>(type: ClassConstructor<T>, value: unknown): T {
  const plain = JSON.parse(JSON.stringify(value));
  return plainToInstance(type, plain, { excludeExtraneousValues: true });
}

export function toResponseList<T>(type: ClassConstructor<T>, values: unknown[]): T[] {
  return values.map((value) => toResponse(type, value));
}
