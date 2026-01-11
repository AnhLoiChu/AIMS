import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEnum } from 'class-validator';
export enum RoleName {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CUSTOMER = 'customer',
}
@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  role_id: number;

  @Column({ type: 'enum', enum: RoleName, unique: true })
  @IsEnum(RoleName)
  name: RoleName;
}
