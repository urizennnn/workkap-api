export interface PaystackInitializeData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: PaystackInitializeData;
}

export interface PaystackVerifyData {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  currency: string;
  gateway_response: string;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackVerifyData;
}

