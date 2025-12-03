import axios from 'axios';
import { config } from '../config';

const ZARINPAL_REQUEST_URL = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/v4/payment/request.json'
  : 'https://api.zarinpal.com/pg/v4/payment/request.json';

const ZARINPAL_VERIFY_URL = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json'
  : 'https://api.zarinpal.com/pg/v4/payment/verify.json';

const ZARINPAL_GATEWAY_URL = config.zarinpal.sandbox
  ? 'https://sandbox.zarinpal.com/pg/StartPay/'
  : 'https://www.zarinpal.com/pg/StartPay/';

interface PaymentRequestResponse {
  data: {
    code: number;
    authority: string;
    fee_type: string;
    fee: number;
  };
  errors: any[];
}

interface PaymentVerifyResponse {
  data: {
    code: number;
    ref_id: number;
    card_pan: string;
    card_hash: string;
    fee_type: string;
    fee: number;
  };
  errors: any[];
}

class PaymentService {
  private merchantId: string;

  constructor() {
    this.merchantId = config.zarinpal.merchantId;
  }

  /**
   * Create payment request
   */
  async createPayment(
    amount: number,
    description: string,
    callbackUrl: string,
    email?: string,
    phone?: string
  ): Promise<{ success: boolean; authority?: string; paymentUrl?: string; error?: string }> {
    if (!this.merchantId) {
      // Dev mode - return mock authority
      const mockAuthority = 'DEV_' + Date.now();
      return {
        success: true,
        authority: mockAuthority,
        paymentUrl: `${config.frontendUrl}/payment/callback?Authority=${mockAuthority}&Status=OK`,
      };
    }

    try {
      const response = await axios.post<PaymentRequestResponse>(ZARINPAL_REQUEST_URL, {
        merchant_id: this.merchantId,
        amount: amount * 10, // Convert Toman to Rial
        description,
        callback_url: callbackUrl,
        metadata: {
          email,
          mobile: phone,
        },
      });

      if (response.data.data.code === 100) {
        return {
          success: true,
          authority: response.data.data.authority,
          paymentUrl: ZARINPAL_GATEWAY_URL + response.data.data.authority,
        };
      }

      return {
        success: false,
        error: `Payment request failed with code: ${response.data.data.code}`,
      };
    } catch (error: any) {
      console.error('Payment request error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(
    authority: string,
    amount: number
  ): Promise<{ success: boolean; refId?: number; error?: string }> {
    if (!this.merchantId) {
      // Dev mode - return mock success
      if (authority.startsWith('DEV_')) {
        return {
          success: true,
          refId: Date.now(),
        };
      }
      return {
        success: false,
        error: 'Invalid authority',
      };
    }

    try {
      const response = await axios.post<PaymentVerifyResponse>(ZARINPAL_VERIFY_URL, {
        merchant_id: this.merchantId,
        amount: amount * 10, // Convert Toman to Rial
        authority,
      });

      if (response.data.data.code === 100 || response.data.data.code === 101) {
        return {
          success: true,
          refId: response.data.data.ref_id,
        };
      }

      return {
        success: false,
        error: `Payment verification failed with code: ${response.data.data.code}`,
      };
    } catch (error: any) {
      console.error('Payment verify error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const paymentService = new PaymentService();
