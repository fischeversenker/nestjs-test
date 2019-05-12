import { Module, HttpModule } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [HttpModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
