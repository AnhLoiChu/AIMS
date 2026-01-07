import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';
import { ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../../role/entities/role.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  user_id: number;

  @Column()
  @IsString()
  name: string;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @IsPhoneNumber('VN')
  phone: string;

  @Column()
  password: string;
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'user_id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'role_id',
    },
  })
  roles: Role[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  edit_count: number;

  @Column({ default: 0 })
  delete_count: number;
}
