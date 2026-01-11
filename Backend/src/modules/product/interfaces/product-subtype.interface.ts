export interface IProductSubtypeService<T, CreateDto, UpdateDto> {
  create(dto: CreateDto & { [key: string]: number }): Promise<T>;
  findOne(options: any): Promise<T | null>;
  update(id: number, dto: UpdateDto): Promise<T>;
  delete(id: number): Promise<void>;
} 