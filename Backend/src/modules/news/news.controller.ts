import { Controller } from '@nestjs/common';
import { NewsService } from './news.service';
import { News } from './entities/news.entity';
import { CrudController } from '@dataui/crud';

@Controller('news')
export class NewsController implements CrudController<News> {
  constructor(public service: NewsService) {}
}
