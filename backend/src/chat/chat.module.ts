import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../database/entities/business.entity';
import { ChatMessage } from '../database/entities/chat-message.entity';
import { ChatThread } from '../database/entities/chat-thread.entity';
import { User } from '../database/entities/user.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatThread, ChatMessage, Business, User]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
