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

class SMSService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.kavenegar.apiKey;
  }

  /**
   * Send OTP verification code using Kavenegar template
   */
  async sendOTP(phone: string, code: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] OTP for ${phone}: ${code}`);
      return true;
    }

    try {
      // Use Kavenegar verify/lookup with template "verify"
      const response = await axios.get<KavenegarResponse>(
        `${KAVENEGAR_BASE_URL}/${this.apiKey}/verify/lookup.json`,
        {
          params: {
            receptor: phone,
            token: code,
            template: 'verify',
          },
        }
      );

      return response.data.return.status === 200;
    } catch (error: any) {
      console.error('SMS send error:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Send order status update notification
   */
  async sendOrderUpdate(phone: string, orderNumber: string, status: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Order update for ${phone}: ${orderNumber} - ${status}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nسفارش ${orderNumber}\nوضعیت: ${status}`;

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

  /**
   * Send technician assignment notification
   */
  async sendTechnicianAssigned(
    phone: string,
    orderNumber: string,
    technicianName: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Technician assigned for ${phone}: ${orderNumber} - ${technicianName}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nتکنسین ${technicianName} به سفارش ${orderNumber} اختصاص یافت.`;

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

  /**
   * Send custom message
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

  /**
   * Send new order notification to admin
   */
  async sendNewOrderToAdmin(phone: string, orderNumber: string, customerName: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] New order for admin ${phone}: ${orderNumber} from ${customerName}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nسفارش جدید ${orderNumber}\nمشتری: ${customerName}`;

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

  /**
   * Send order assignment notification to technician
   */
  async sendOrderAssignedToTechnician(
    phone: string,
    orderNumber: string,
    customerName: string,
    issues: string[]
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Order assigned to technician ${phone}: ${orderNumber}`);
      return true;
    }

    try {
      const issuesList = issues.slice(0, 3).join('، ');
      const message = `اکسون موتور\nسفارش ${orderNumber} به شما اختصاص یافت\nمشتری: ${customerName}\nمشکلات: ${issuesList}`;

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

  /**
   * Send order cancellation notification
   */
  async sendOrderCancelled(phone: string, orderNumber: string, role: 'admin' | 'technician'): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Order cancelled for ${role} ${phone}: ${orderNumber}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nسفارش ${orderNumber} توسط مشتری لغو شد.`;

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

  /**
   * Send new message notification to technician
   */
  async sendNewMessageToTechnician(phone: string, customerName: string, orderNumber: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] New message for technician ${phone} from ${customerName}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nپیام جدید از ${customerName}\nسفارش: ${orderNumber}`;

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

  /**
   * Send receipt notification to customer
   */
  async sendReceiptCreated(phone: string, receiptNumber: string, amount: number): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`[DEV MODE] Receipt for ${phone}: ${receiptNumber} - ${amount}`);
      return true;
    }

    try {
      const message = `اکسون موتور\nفاکتور ${receiptNumber} صادر شد\nمبلغ: ${amount.toLocaleString('fa-IR')} تومان`;

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
