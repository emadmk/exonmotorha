import axios from 'axios';
import { config } from '../config';

const KAVENEGAR_BASE_URL = 'https://api.kavenegar.com/v1';

interface KavenegarResponse {
  return: {
    status: number;
    message: string;
  };
  entries?: any[];
}

// Template names - must match exactly in Kavenegar panel
const TEMPLATES = {
  VERIFY: 'verify',
  ORDER_NEW_CUSTOMER: 'ordernewcustomer',
  ORDER_NEW_ADMIN: 'ordernewadmin',
  ORDER_ASSIGNED_CUSTOMER: 'orderassignedcustomer',
  ORDER_ASSIGNED_TECHNICIAN: 'orderassignedtechnician',
  ORDER_STATUS: 'orderstatus',
  ORDER_CANCELLED: 'ordercancelled',
  NEW_MESSAGE: 'newmessage',
  RECEIPT_CREATED: 'receiptcreated',
};

class SMSService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.kavenegar.apiKey;
  }

  /**
   * Send templated SMS using Kavenegar lookup
   */
  private async sendTemplate(
    phone: string,
    template: string,
    token: string,
    token2?: string,
    token3?: string,
    token10?: string,
    token20?: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Template ${template} for ${phone}: ${token}, ${token2}, ${token3}`);
      return true;
    }

    try {
      const params: any = {
        receptor: phone,
        template,
        token,
      };

      if (token2) params.token2 = token2;
      if (token3) params.token3 = token3;
      if (token10) params.token10 = token10;
      if (token20) params.token20 = token20;

      const response = await axios.get<KavenegarResponse>(
        `${KAVENEGAR_BASE_URL}/${this.apiKey}/verify/lookup.json`,
        { params }
      );

      return response.data.return.status === 200;
    } catch (error: any) {
      console.error('SMS send error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send OTP verification code
   * Template: verify
   * Pattern: کد تایید شما: %token
   */
  async sendOTP(phone: string, code: string): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.VERIFY, code);
  }

  /**
   * Send new order confirmation to customer
   * Template: ordernewcustomer
   * Pattern: سفارش %token با موفقیت ثبت شد
   */
  async sendNewOrderToCustomer(phone: string, orderNumber: string): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.ORDER_NEW_CUSTOMER, orderNumber);
  }

  /**
   * Send new order notification to admin
   * Template: ordernewadmin
   * Pattern: سفارش جدید %token از مشتری %token2
   */
  async sendNewOrderToAdmin(phone: string, orderNumber: string, customerName: string): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.ORDER_NEW_ADMIN, orderNumber, customerName);
  }

  /**
   * Send technician assignment notification to customer
   * Template: orderassignedcustomer
   * Pattern: تکنسین %token برای سفارش %token2 اختصاص یافت
   */
  async sendTechnicianAssigned(
    phone: string,
    orderNumber: string,
    technicianName: string
  ): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.ORDER_ASSIGNED_CUSTOMER, technicianName, orderNumber);
  }

  /**
   * Send order assignment notification to technician
   * Template: orderassignedtechnician
   * Pattern: سفارش %token به شما اختصاص یافت. مشتری: %token2. مشکلات: %token3
   */
  async sendOrderAssignedToTechnician(
    phone: string,
    orderNumber: string,
    customerName: string,
    issues: string[]
  ): Promise<boolean> {
    const issuesList = issues.slice(0, 3).join('-');
    return this.sendTemplate(
      phone,
      TEMPLATES.ORDER_ASSIGNED_TECHNICIAN,
      orderNumber,
      customerName,
      issuesList
    );
  }

  /**
   * Send order status update notification
   * Template: orderstatus
   * Pattern: وضعیت سفارش %token: %token2
   */
  async sendOrderUpdate(phone: string, orderNumber: string, status: string): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.ORDER_STATUS, orderNumber, status);
  }

  /**
   * Send order cancellation notification
   * Template: ordercancelled
   * Pattern: سفارش %token توسط مشتری لغو شد
   */
  async sendOrderCancelled(phone: string, orderNumber: string, role: 'admin' | 'technician'): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.ORDER_CANCELLED, orderNumber);
  }

  /**
   * Send new message notification to technician
   * Template: newmessage
   * Pattern: پیام جدید از %token برای سفارش %token2
   */
  async sendNewMessageToTechnician(phone: string, customerName: string, orderNumber: string): Promise<boolean> {
    return this.sendTemplate(phone, TEMPLATES.NEW_MESSAGE, customerName, orderNumber);
  }

  /**
   * Send receipt notification to customer
   * Template: receiptcreated
   * Pattern: فاکتور %token به مبلغ %token2 تومان صادر شد
   */
  async sendReceiptCreated(phone: string, receiptNumber: string, amount: number): Promise<boolean> {
    const formattedAmount = amount.toLocaleString('fa-IR');
    return this.sendTemplate(phone, TEMPLATES.RECEIPT_CREATED, receiptNumber, formattedAmount);
  }

  /**
   * Send custom message (fallback using sms/send)
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Message for ${phone}: ${message}`);
      return true;
    }

    try {
      const response = await axios.get<KavenegarResponse>(
        `${KAVENEGAR_BASE_URL}/${this.apiKey}/sms/send.json`,
        {
          params: {
            receptor: phone,
            message: message,
          },
        }
      );

      return response.data.return.status === 200;
    } catch (error: any) {
      console.error('SMS send error:', error.response?.data || error.message);
      return false;
    }
  }
}

export const smsService = new SMSService();
