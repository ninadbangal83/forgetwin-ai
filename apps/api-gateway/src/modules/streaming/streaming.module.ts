import { Module } from '@nestjs/common';
import { StreamingController } from '@/modules/streaming/streaming.controller';
import { StreamingService } from '@/modules/streaming/streaming.service';


@Module({
  controllers: [StreamingController],
  providers: [StreamingService],
  exports: [StreamingService]
})
export class StreamingModule {}
