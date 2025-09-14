import { Entity, ChildEntity, Column } from 'typeorm';
import { User, UserRole } from './user.entity';

@ChildEntity(UserRole.MEMBER)
export class Member extends User {
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @Column({ type: 'text', nullable: true })
  fitnessGoals: string;
}