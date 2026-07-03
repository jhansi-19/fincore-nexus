export interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  kycStatus?: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
