import users from './users.json';
import products from './products.json';
import { randomEmail, randomString } from '../utils/common.helper';

export { users, products };

export const endpoints = {
  productsList: 'productsList',
  brandsList: 'brandsList',
  searchProduct: 'searchProduct',
  verifyLogin: 'verifyLogin',
  createAccount: 'createAccount',
  deleteAccount: 'deleteAccount',
  updateAccount: 'updateAccount',
  getUserDetailByEmail: 'getUserDetailByEmail',
} as const;

export const routes = {
  home: '/',
  login: '/login',
  products: '/products',
  cart: '/view_cart',
  contactUs: '/contact_us',
  testCases: '/test_cases',
} as const;

export interface NewUser {
  name: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile_number: string;
  birth_date: string;
  birth_month: string;
  birth_year: string;
}

/** A fresh, collision-free user for signup / create-account tests. */
export function buildNewUser(overrides: Partial<NewUser> = {}): NewUser {
  const t = users.signupTemplate;
  return {
    name: `${t.firstName} ${randomString(5)}`,
    email: randomEmail(),
    password: t.password,
    firstname: t.firstName,
    lastname: t.lastName,
    company: t.company,
    address1: t.address1,
    address2: t.address2,
    country: t.country,
    state: t.state,
    city: t.city,
    zipcode: t.zipcode,
    mobile_number: t.mobileNumber,
    birth_date: '10',
    birth_month: 'May',
    birth_year: '1995',
    ...overrides,
  };
}
