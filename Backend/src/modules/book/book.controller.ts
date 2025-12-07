import { Controller, Delete, Param } from '@nestjs/common';
import { BookService } from './book.service';

import { Book } from './entities/book.entity';
import { CrudController } from '@dataui/crud';

@Controller('book')
export class BookController implements CrudController<Book> {
  constructor(public service: BookService) {}
}
