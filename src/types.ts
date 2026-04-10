export interface Booking {
  id: string;
  bookingId: string;
  bookingDate: string;
  checkIn: string;
  checkOut: string;
  customer: {
    name: string;
    mobile: string;
    aadhar: string;
    address: string;
  };
  event: {
    date: string;
    pax: number;
    type: string;
  };
  payment: {
    rentalAmount: number;
    amountReceived: number;
    paymentDate: string;
    paymentMode: string;
    securityDeposit: number;
  };
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}
