import { faker } from '@faker-js/faker/locale/en';
import AppDataSource from '../../config/data-source.config';
import { User } from '../../modules/user/entities/user.entity';
import { Role } from '../../modules/role/entities/role.entity';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { RoleName } from '../../modules/role/entities/role.entity';
export default async function seedUsers() {
  const userRepo = AppDataSource.getRepository(User);
  const roleRepo = AppDataSource.getRepository(Role);
  const cartRepo = AppDataSource.getRepository(Cart);

  // Ensure roles exist or create them if not
  let customerRole = await roleRepo.findOneBy({ name: RoleName.CUSTOMER });
  if (!customerRole) {
    customerRole = roleRepo.create({ name: RoleName.CUSTOMER });
    await roleRepo.save(customerRole);
  }

  let managerRole = await roleRepo.findOneBy({ name: RoleName.MANAGER });
  if (!managerRole) {
    managerRole = roleRepo.create({ name: RoleName.MANAGER });
    await roleRepo.save(managerRole);
  }

  let adminRole = await roleRepo.findOneBy({ name: RoleName.ADMIN });
  if (!adminRole) {
    adminRole = roleRepo.create({ name: RoleName.ADMIN });
    await roleRepo.save(adminRole);
  }

  // ========== FIXED TEST USERS ==========
  // Test Admin User
  const testAdmin = userRepo.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    phone: '0123456789',
    password: '123456',
    roles: [adminRole],
  });
  await userRepo.save(testAdmin);
  console.log('✅ Created test admin: admin@test.com / 123456');

  // Test Manager User
  const testManager = userRepo.create({
    name: 'Test Manager',
    email: 'manager@test.com',
    phone: '0123456788',
    password: '123456',
    roles: [managerRole],
  });
  await userRepo.save(testManager);
  console.log('✅ Created test manager: manager@test.com / 123456');

  // Test Customer User
  const testCustomer = userRepo.create({
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '0123456787',
    password: '123456',
    roles: [customerRole],
  });
  const savedTestCustomer = await userRepo.save(testCustomer);
  const testCustomerCart = cartRepo.create({
    customer: savedTestCustomer,
    customer_id: savedTestCustomer.user_id,
  });
  await cartRepo.save(testCustomerCart);
  console.log('✅ Created test customer: customer@test.com / 123456');
  // ======================================

  // Seed customers
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: faker.internet.password(),
      roles: [customerRole],
    });
    const savedUser = await userRepo.save(user);

    const cart = cartRepo.create({
      customer: savedUser,
      customer_id: savedUser.user_id,
    });
    await cartRepo.save(cart);
  }

  // Seed managers
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: faker.internet.password(),
      roles: [managerRole],
    });
    await userRepo.save(user);
  }

  // Seed administrators
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: faker.internet.password(),
      roles: [adminRole],
    });
    await userRepo.save(user);
  }

  console.log('Seeded Users with roles and carts');
}
