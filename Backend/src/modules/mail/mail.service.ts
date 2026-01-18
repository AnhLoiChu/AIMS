import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentTransaction } from 'src/modules/payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from 'src/modules/delivery-info/entities/delivery-info.entity';
import { Order } from 'src/modules/order/entities/order.entity';

// Province mapping for Vietnamese names with diacritics
const PROVINCE_NAMES: Record<string, string> = {
  'thanh_pho_ha_noi': 'Thành phố Hà Nội',
  'tinh_ha_giang': 'Tỉnh Hà Giang',
  'tinh_cao_bang': 'Tỉnh Cao Bằng',
  'tinh_bac_kan': 'Tỉnh Bắc Kạn',
  'tinh_tuyen_quang': 'Tỉnh Tuyên Quang',
  'tinh_lao_cai': 'Tỉnh Lào Cai',
  'tinh_dien_bien': 'Tỉnh Điện Biên',
  'tinh_lai_chau': 'Tỉnh Lai Châu',
  'tinh_son_la': 'Tỉnh Sơn La',
  'tinh_yen_bai': 'Tỉnh Yên Bái',
  'tinh_hoa_binh': 'Tỉnh Hòa Bình',
  'tinh_thai_nguyen': 'Tỉnh Thái Nguyên',
  'tinh_lang_son': 'Tỉnh Lạng Sơn',
  'tinh_quang_ninh': 'Tỉnh Quảng Ninh',
  'tinh_bac_giang': 'Tỉnh Bắc Giang',
  'tinh_phu_tho': 'Tỉnh Phú Thọ',
  'tinh_vinh_phuc': 'Tỉnh Vĩnh Phúc',
  'tinh_bac_ninh': 'Tỉnh Bắc Ninh',
  'tinh_hai_duong': 'Tỉnh Hải Dương',
  'thanh_pho_hai_phong': 'Thành phố Hải Phòng',
  'tinh_hung_yen': 'Tỉnh Hưng Yên',
  'tinh_thai_binh': 'Tỉnh Thái Bình',
  'tinh_ha_nam': 'Tỉnh Hà Nam',
  'tinh_nam_dinh': 'Tỉnh Nam Định',
  'tinh_ninh_binh': 'Tỉnh Ninh Bình',
  'tinh_thanh_hoa': 'Tỉnh Thanh Hóa',
  'tinh_nghe_an': 'Tỉnh Nghệ An',
  'tinh_ha_tinh': 'Tỉnh Hà Tĩnh',
  'tinh_quang_binh': 'Tỉnh Quảng Bình',
  'tinh_quang_tri': 'Tỉnh Quảng Trị',
  'tinh_thua_thien_hue': 'Tỉnh Thừa Thiên Huế',
  'thanh_pho_da_nang': 'Thành phố Đà Nẵng',
  'tinh_quang_nam': 'Tỉnh Quảng Nam',
  'tinh_quang_ngai': 'Tỉnh Quảng Ngãi',
  'tinh_binh_dinh': 'Tỉnh Bình Định',
  'tinh_phu_yen': 'Tỉnh Phú Yên',
  'tinh_khanh_hoa': 'Tỉnh Khánh Hòa',
  'tinh_ninh_thuan': 'Tỉnh Ninh Thuận',
  'tinh_binh_thuan': 'Tỉnh Bình Thuận',
  'tinh_kon_tum': 'Tỉnh Kon Tum',
  'tinh_gia_lai': 'Tỉnh Gia Lai',
  'tinh_dak_lak': 'Tỉnh Đắk Lắk',
  'tinh_dak_nong': 'Tỉnh Đắk Nông',
  'tinh_lam_dong': 'Tỉnh Lâm Đồng',
  'tinh_binh_phuoc': 'Tỉnh Bình Phước',
  'tinh_tay_ninh': 'Tỉnh Tây Ninh',
  'tinh_binh_duong': 'Tỉnh Bình Dương',
  'tinh_dong_nai': 'Tỉnh Đồng Nai',
  'tinh_ba_ria_vung_tau': 'Tỉnh Bà Rịa - Vũng Tàu',
  'thanh_pho_ho_chi_minh': 'Thành phố Hồ Chí Minh',
  'tinh_long_an': 'Tỉnh Long An',
  'tinh_tien_giang': 'Tỉnh Tiền Giang',
  'tinh_ben_tre': 'Tỉnh Bến Tre',
  'tinh_tra_vinh': 'Tỉnh Trà Vinh',
  'tinh_vinh_long': 'Tỉnh Vĩnh Long',
  'tinh_dong_thap': 'Tỉnh Đồng Tháp',
  'tinh_an_giang': 'Tỉnh An Giang',
  'tinh_kien_giang': 'Tỉnh Kiên Giang',
  'thanh_pho_can_tho': 'Thành phố Cần Thơ',
  'tinh_hau_giang': 'Tỉnh Hậu Giang',
  'tinh_soc_trang': 'Tỉnh Sóc Trăng',
  'tinh_bac_lieu': 'Tỉnh Bạc Liêu',
  'tinh_ca_mau': 'Tỉnh Cà Mau',
};

const getProvinceName = (codename: string): string => {
  return PROVINCE_NAMES[codename] || codename
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) { }

  async sendOrderConfirmation(
    order: Order,
    transaction: PaymentTransaction,
    deliveryInfo: DeliveryInfo,
  ) {
    const subject = `Order Confirmation - #${order.order_id}`;
    const totalAmount = (order.subtotal + order.delivery_fee).toFixed(2);

    try {
      await this.mailerService.sendMail({
        to: deliveryInfo.email,
        subject,
        html: `
          <h1>Order Confirmation</h1>
          <p>Dear ${deliveryInfo.recipient_name},</p>
          <p>Thank you for your order. Here are the details:</p>
          <h2>Order Information</h2>
          <ul>
            <li><strong>Customer Name:</strong> ${deliveryInfo.recipient_name}</li>
            <li><strong>Phone Number:</strong> ${deliveryInfo.phone}</li>
            <li><strong>Shipping Address:</ strong> ${deliveryInfo.address}</li>
            <li><strong>Province:</strong> ${getProvinceName(deliveryInfo.province)}</li>
            <li><strong>Total Amount:</strong> ${Number(totalAmount).toLocaleString('vi-VN')} VND</li>
          </ul>
          <h2>Transaction Information</h2>
          <ul>
            <li><strong>Transaction ID:</strong> ${transaction.payment_transaction_id}</li>
            <li><strong>Transaction Content:</strong> ${transaction.content}</li>
            <li><strong>Transaction Datetime:</strong> ${transaction.time}</li>
          </ul>
          <p>Your order is now waiting for approval processing.</p>
        `,
      });
      this.logger.log(`Order confirmation email sent to ${deliveryInfo.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email to ${deliveryInfo.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendOrderCancellation(
    order: Order,
    deliveryInfo: DeliveryInfo,
  ) {
    const subject = `Order Cancellation Confirmation - #${order.order_id}`;
    const totalAmount = (order.subtotal + order.delivery_fee).toFixed(2);

    try {
      await this.mailerService.sendMail({
        to: deliveryInfo.email,
        subject,
        html: `
          <h1>Order Cancellation Confirmation</h1>
          <p>Dear ${deliveryInfo.recipient_name},</p>
          <p>We are writing to confirm that your order <strong>#${order.order_id}</strong> has been successfully cancelled as per your request.</p>
          <h2>Order Details:</h2>
          <ul>
            <li><strong>Order ID:</strong> #${order.order_id}</li>
            <li><strong>Total Amount:</strong> ${Number(totalAmount).toLocaleString('vi-VN')} VND</li>
          </ul>
          <p>If you have already made a payment, our support team will contact you regarding the refund process soon.</p>
        `,
      });
      this.logger.log(`Order cancellation email sent to ${deliveryInfo.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order cancellation email to ${deliveryInfo.email}`,
        error.stack,
      );
      throw error;
    }
  }
}
