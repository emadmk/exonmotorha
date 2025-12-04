import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car,
  Wrench,
  Shield,
  Clock,
  Star,
  ChevronLeft,
  Phone,
  MapPin,
  Mail,
  Zap,
  Battery,
  Settings,
  AlertTriangle,
  Volume2,
  Cog,
  CheckCircle,
  Users,
  Award,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/ui/GlassCard';
import { adminAPI } from '../services/api';
import { PublicStats } from '../types';
import { toPersianDigits, formatNumber } from '../utils/helpers';

// Services data
const services = [
  { icon: AlertTriangle, title: 'تصادف', description: 'امداد در تصادفات و ارزیابی خسارت' },
  { icon: Cog, title: 'خرابی موتور', description: 'تعمیر انواع خرابی‌های موتور' },
  { icon: Settings, title: 'تعمیر گیربکس', description: 'تعمیر و سرویس گیربکس اتوماتیک و دستی' },
  { icon: Car, title: 'پنچری', description: 'تعویض و تعمیر لاستیک در محل' },
  { icon: Battery, title: 'باتری', description: 'تعویض و شارژ باتری' },
  { icon: Volume2, title: 'صدای غیرعادی', description: 'تشخیص و رفع صداهای مشکوک' },
  { icon: Zap, title: 'مشکل برقی', description: 'تعمیر سیستم برق خودرو' },
  { icon: Wrench, title: 'تعمیر بدنه', description: 'تعمیرات جزئی بدنه' },
];

// Features data
const features = [
  {
    icon: Clock,
    title: 'سرویس سریع',
    description: 'حداکثر ۳۰ دقیقه بعد از ثبت درخواست، تکنسین در محل شما حاضر می‌شود',
  },
  {
    icon: Shield,
    title: 'ضمانت کیفیت',
    description: 'تمام خدمات با ضمانت کیفیت و قطعات اصلی ارائه می‌شود',
  },
  {
    icon: Users,
    title: 'تکنسین‌های مجرب',
    description: 'تیم ما از بهترین و باتجربه‌ترین تکنسین‌ها تشکیل شده است',
  },
  {
    icon: Star,
    title: 'قیمت منصفانه',
    description: 'قیمت‌گذاری شفاف و بدون هزینه پنهان',
  },
];

// FAQ data
const faqs = [
  {
    q: 'چگونه می‌توانم درخواست خدمت ثبت کنم؟',
    a: 'کافیست روی دکمه "درخواست خدمت" کلیک کنید، شماره موبایل و اطلاعات خودرو را وارد کنید و نوع مشکل را انتخاب کنید.',
  },
  {
    q: 'هزینه خدمات چگونه محاسبه می‌شود؟',
    a: 'پس از بررسی خودرو توسط تکنسین، هزینه دقیق اعلام می‌شود. قبل از شروع کار، شما باید هزینه را تایید کنید.',
  },
  {
    q: 'آیا قطعات استفاده شده اصل هستند؟',
    a: 'بله، تمام قطعات استفاده شده اصل و دارای ضمانت هستند.',
  },
  {
    q: 'در چه ساعاتی خدمات ارائه می‌شود؟',
    a: 'خدمات ما ۲۴ ساعته و ۷ روز هفته در دسترس است.',
  },
  {
    q: 'اگر از خدمات راضی نباشم چه کنم؟',
    a: 'رضایت شما برای ما اهمیت دارد. در صورت هرگونه نارضایتی، با پشتیبانی تماس بگیرید.',
  },
  {
    q: 'پرداخت چگونه انجام می‌شود؟',
    a: 'امکان پرداخت نقدی، کارتخوان در محل و پرداخت آنلاین وجود دارد.',
  },
];

export function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    adminAPI.getPublicStats().then((res) => {
      setStats(res.data.stats);
    }).catch(() => {
      // Use fallback stats
      setStats({
        totalCustomers: 1200,
        totalTechnicians: 80,
        completedOrders: 500,
        satisfactionRate: 98,
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      <Header transparent />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-950/95 to-dark-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-2 bg-gold-600/10 border border-gold-600/30 rounded-full text-gold-500 text-sm mb-6">
              خدمات تعمیر خودرو در محل شما
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="gradient-text">اکسون موتور</span>
              <br />
              همراه مطمئن خودروی شما
            </h1>

            <p className="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-10">
              با یک کلیک ماشینت در خونه تحویل میگیریم و همه کارهاش انجام میشه و در خونه تحویل بگیر
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/request"
                className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                <span>درخواست خدمت</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <a
                href="tel:03491097545"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>تماس با ما</span>
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
          >
            {[
              { value: stats ? `+${formatNumber(stats.totalCustomers)}` : '+۱,۲۰۰', label: 'مشتری راضی' },
              { value: stats ? `+${formatNumber(stats.totalTechnicians)}` : '+۸۰', label: 'تکنسین مجرب' },
              { value: stats ? `${toPersianDigits(stats.satisfactionRate)}٪` : '۹۸٪', label: 'رضایت مشتری' },
              { value: '۲۴/۷', label: 'پشتیبانی' },
            ].map((stat, index) => (
              <GlassCard key={index} padding="md" className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-dark-400 text-sm">{stat.label}</div>
              </GlassCard>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-dark-500" />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold-500 text-sm font-medium mb-2 block">خدمات ما</span>
            <h2 className="section-title">چه خدماتی ارائه می‌دهیم؟</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              تیم متخصص ما آماده ارائه انواع خدمات تعمیر و نگهداری خودرو در محل شماست
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard
                  hoverable
                  padding="lg"
                  className="text-center cursor-pointer group"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-gold-600/10 rounded-2xl flex items-center justify-center group-hover:bg-gold-600/20 transition-colors">
                    <service.icon className="w-7 h-7 text-gold-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-dark-400">{service.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold-500 text-sm font-medium mb-2 block">چرا اکسون موتور؟</span>
            <h2 className="section-title">مزایای خدمات ما</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard padding="lg" className="h-full">
                  <div className="w-12 h-12 mb-4 bg-gradient-gold rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-dark-950" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-dark-400 text-sm">{feature.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="about" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold-500 text-sm font-medium mb-2 block">فرآیند کار</span>
            <h2 className="section-title">چگونه کار می‌کند؟</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '۱', title: 'ثبت درخواست', desc: 'اطلاعات خودرو و مشکل را وارد کنید' },
              { step: '۲', title: 'تایید و هماهنگی', desc: 'تکنسین با شما هماهنگ می‌کند' },
              { step: '۳', title: 'حضور تکنسین', desc: 'تکنسین در محل حاضر می‌شود' },
              { step: '۴', title: 'انجام تعمیرات', desc: 'خودرو شما تعمیر می‌شود' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-dark-800 rounded-full flex items-center justify-center border-2 border-gold-600">
                  <span className="text-2xl font-bold text-gold-500">{item.step}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative bg-dark-900/50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold-500 text-sm font-medium mb-2 block">سوالات متداول</span>
            <h2 className="section-title">پاسخ به سوالات شما</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard
                  padding="none"
                  className="overflow-hidden cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between p-5">
                    <h3 className="font-medium text-white">{faq.q}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-dark-400 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  {openFaq === index && (
                    <div className="px-5 pb-5 pt-0 text-dark-400 border-t border-dark-700">
                      <p className="pt-4">{faq.a}</p>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <GlassCard padding="lg" className="py-16">
              <Award className="w-16 h-16 mx-auto mb-6 text-gold-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                آماده دریافت خدمات هستید؟
              </h2>
              <p className="text-dark-400 mb-8 max-w-lg mx-auto">
                همین حالا درخواست خود را ثبت کنید و از خدمات حرفه‌ای ما بهره‌مند شوید
              </p>
              <Link
                to="/request"
                className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2"
              >
                <span>ثبت درخواست رایگان</span>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-900/80 border-t border-dark-700/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold gradient-text">اکسون</span>
                <span className="text-xl font-bold text-white">موتور</span>
              </div>
              <p className="text-dark-400 text-sm">
                ارائه‌دهنده خدمات تعمیر و نگهداری خودرو در محل
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">دسترسی سریع</h4>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li><a href="#services" className="hover:text-white transition-colors">خدمات</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">درباره ما</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">سوالات متداول</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">تماس با ما</h4>
              <ul className="space-y-3 text-dark-400 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>کرمان، شهرک باهنر، بحرالعلوم ۱۳، پلاک ۲۱</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span dir="ltr">034-91097545</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span>info@exonmotor.ir</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-dark-700/50 text-center text-dark-500 text-sm">
            <p>© {toPersianDigits(new Date().getFullYear())} اکسون موتور. تمام حقوق محفوظ است.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
