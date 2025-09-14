import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Member)
    private usersRepository: Repository<Member>,
  ) {}

  async findByEmail(email: string): Promise<Member | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Add other user methods here
}