import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  Car,
  AlertCircle,
  MapPin,
  Check,
  Plus,
  Navigation,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { OTPInput } from '../components/ui/OTPInput';
import { authAPI, vehicleAPI, orderAPI } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Vehicle, ISSUE_TYPES } from '../types';
import {
  cn,
  isValidPhone,
  formatPhoneForAPI,
  toPersianDigits,
  toEnglishDigits,
} from '../utils/helpers';

type Step = 'phone' | 'otp' | 'vehicle' | 'issues' | 'location';

const steps = [
  { id: 'phone', title: 'شماره موبایل' },
  { id: 'vehicle', title: 'اطلاعات خودرو' },
  { id: 'issues', title: 'نوع مشکل' },
  { id: 'location', title: 'موقعیت مکانی' },
];

// Car brands
const CAR_BRANDS = [
  { value: 'fownix', label: 'فونیکس (Fownix)' },
  { value: 'mvm', label: 'ام‌وی‌ام (MVM)' },
  { value: 'toyota', label: 'تویوتا (Toyota)' },
  { value: 'nissan', label: 'نیسان (Nissan)' },
  { value: 'bmw', label: 'بی‌ام‌و (BMW)' },
  { value: 'benz', label: 'بنز (Benz)' },
  { value: 'ikco', label: 'ایران‌خودرو (IKCO)' },
  { value: 'saipa', label: 'سایپا (Saipa)' },
  { value: 'other', label: 'سایر' },
];

// Generate years from 1370 to 1404 (1992 to 2025)
const generateYears = () => {
  const years = [];
  for (let shamsi = 1370; shamsi <= 1404; shamsi++) {
    const miladi = shamsi + 621;
    years.push({
      value: miladi.toString(),
      label: `${toPersianDigits(shamsi)} - ${miladi}`,
    });
  }
  return years.reverse(); // Most recent first
};

const CAR_YEARS = generateYears();

// Default center: Tehran
const DEFAULT_LAT = 35.6892;
const DEFAULT_LNG = 51.3890;

export function RequestForm() {
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuthStore();

  const [step, setStep] = useState<Step>(isAuthenticated ? 'vehicle' : 'phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [newVehicle, setNewVehicle] = useState({
    brand: '',
    customBrand: '',
    model: '',
    year: '',
    plateNumber: '',
  });
  const [showNewVehicle, setShowNewVehicle] = useState(false);

  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const [locationAddress, setLocationAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const mapRef = useRef<HTMLIFrameElement>(null);

  // Load vehicles if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadVehicles();
    }
  }, [isAuthenticated]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const loadVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll();
      setVehicles(response.data.vehicles);
      if (response.data.vehicles.length > 0) {
        const defaultVehicle = response.data.vehicles.find((v: Vehicle) => v.isDefault);
        setSelectedVehicle(defaultVehicle?._id || response.data.vehicles[0]._id);
      } else {
        setShowNewVehicle(true);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleSendOTP = async () => {
    const formattedPhone = formatPhoneForAPI(phone);
    if (!isValidPhone(formattedPhone)) {
      setError('شماره موبایل نامعتبر است');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.sendOTP(formattedPhone);
      setCountdown(response.data.expiresIn || 120);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ارسال کد');
      if (err.response?.data?.remainingTime) {
        setCountdown(err.response.data.remainingTime);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setOtp(code);
    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(formatPhoneForAPI(phone), code);
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);
      setStep('vehicle');
      loadVehicles();
    } catch (err: any) {
      setError(err.response?.data?.message || 'کد تایید اشتباه است');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVehicle = async () => {
    const brandValue = newVehicle.brand === 'other' ? newVehicle.customBrand : newVehicle.brand;
    if (!brandValue || !newVehicle.model || !newVehicle.year) {
      setError('لطفاً اطلاعات خودرو را کامل کنید');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get the brand label for known brands
      const brandLabel = newVehicle.brand === 'other'
        ? newVehicle.customBrand
        : CAR_BRANDS.find(b => b.value === newVehicle.brand)?.label.split(' ')[0] || newVehicle.brand;

      const response = await vehicleAPI.create({
        brand: brandLabel,
        model: newVehicle.model,
        year: parseInt(toEnglishDigits(newVehicle.year)),
        plateNumber: newVehicle.plateNumber,
      });
      setVehicles([...vehicles, response.data.vehicle]);
      setSelectedVehicle(response.data.vehicle._id);
      setShowNewVehicle(false);
      setStep('issues');
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت خودرو');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!acceptTerms) {
      setError('لطفاً قوانین و مقررات را بپذیرید');
      return;
    }

    if (!coordinates) {
      setError('لطفاً موقعیت مکانی را انتخاب کنید');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await orderAPI.create({
        vehicleId: selectedVehicle,
        issues: selectedIssues,
        description,
        location: {
          address: locationAddress,
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng,
          },
        },
      });

      navigate('/success', {
        state: { orderNumber: response.data.order.orderNumber },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت سفارش');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Try to get address from coordinates (reverse geocoding)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fa`
          );
          const data = await response.json();
          if (data.display_name) {
            setLocationAddress(data.display_name);
          }
        } catch (e) {
          console.error('Error getting address:', e);
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('دسترسی به موقعیت مکانی امکان‌پذیر نیست');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setCoordinates({ lat, lng });

    // Try to get address from coordinates
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fa`
      );
      const data = await response.json();
      if (data.display_name) {
        setLocationAddress(data.display_name);
      }
    } catch (e) {
      console.error('Error getting address:', e);
    }
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 'phone':
        return isValidPhone(formatPhoneForAPI(phone));
      case 'otp':
        return otp.length === 5;
      case 'vehicle':
        const hasBrand = newVehicle.brand && (newVehicle.brand !== 'other' || newVehicle.customBrand);
        return selectedVehicle || (hasBrand && newVehicle.model && newVehicle.year);
      case 'issues':
        return selectedIssues.length > 0;
      case 'location':
        return coordinates && acceptTerms;
      default:
        return false;
    }
  };

  const getStepIndex = () => {
    if (step === 'phone' || step === 'otp') return 0;
    return steps.findIndex((s) => s.id === step);
  };

  return (
    <div className="min-h-screen bg-dark-950 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -mr-2 text-dark-400 hover:text-white"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-white">
            درخواست خدمت
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  index <= getStepIndex()
                    ? 'bg-gold-600 text-dark-950'
                    : 'bg-dark-800 text-dark-500'
                )}
              >
                {index < getStepIndex() ? (
                  <Check className="w-4 h-4" />
                ) : (
                  toPersianDigits(index + 1)
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 sm:w-20 h-0.5 mx-1',
                    index < getStepIndex() ? 'bg-gold-600' : 'bg-dark-800'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-dark-400 text-sm">
          {steps[getStepIndex()]?.title}
        </p>
      </div>

      <main className="max-w-lg mx-auto px-4">
        <AnimatePresence mode="wait">
          {/* Phone Step */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard padding="lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold-600/20 rounded-full flex items-center justify-center">
                    <Phone className="w-8 h-8 text-gold-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    شماره موبایل
                  </h2>
                  <p className="text-dark-400">
                    برای ثبت درخواست، شماره موبایل خود را وارد کنید
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    type="tel"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    error={error}
                    dir="ltr"
                    className="text-center text-lg"
                  />

                  <Button
                    onClick={handleSendOTP}
                    isLoading={isLoading}
                    disabled={!canProceed() || countdown > 0}
                    fullWidth
                  >
                    {countdown > 0
                      ? `ارسال مجدد (${toPersianDigits(countdown)})`
                      : 'دریافت کد تایید'}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard padding="lg">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">
                    کد تایید
                  </h2>
                  <p className="text-dark-400">
                    کد ۵ رقمی ارسال شده را وارد کنید
                  </p>
                </div>

                <div className="space-y-6">
                  <OTPInput
                    onComplete={handleVerifyOTP}
                    disabled={isLoading}
                    error={!!error}
                  />

                  {error && (
                    <p className="text-center text-red-400 text-sm">{error}</p>
                  )}

                  <div className="flex justify-between text-sm">
                    <button
                      onClick={() => setStep('phone')}
                      className="text-dark-400 hover:text-white"
                    >
                      تغییر شماره
                    </button>
                    <button
                      onClick={handleSendOTP}
                      disabled={countdown > 0}
                      className={cn(
                        countdown > 0 ? 'text-dark-500' : 'text-gold-500'
                      )}
                    >
                      {countdown > 0
                        ? `${toPersianDigits(countdown)} ثانیه`
                        : 'ارسال مجدد'}
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Vehicle Step */}
          {step === 'vehicle' && (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard padding="lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold-600/20 rounded-full flex items-center justify-center">
                    <Car className="w-8 h-8 text-gold-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    اطلاعات خودرو
                  </h2>
                </div>

                {!showNewVehicle && vehicles.length > 0 ? (
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        onClick={() => setSelectedVehicle(vehicle._id)}
                        className={cn(
                          'p-4 rounded-xl border-2 cursor-pointer transition-all',
                          selectedVehicle === vehicle._id
                            ? 'border-gold-600 bg-gold-600/10'
                            : 'border-dark-700 hover:border-dark-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-dark-800 rounded-lg flex items-center justify-center">
                            <Car className="w-5 h-5 text-gold-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="text-sm text-dark-400">
                              {toPersianDigits(vehicle.year)}
                              {vehicle.plateNumber && ` • ${vehicle.plateNumber}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowNewVehicle(true)}
                      className="w-full p-4 border-2 border-dashed border-dark-700 rounded-xl text-dark-400 hover:border-dark-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      افزودن خودرو جدید
                    </button>

                    <Button
                      onClick={() => setStep('issues')}
                      disabled={!selectedVehicle}
                      fullWidth
                    >
                      ادامه
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Brand Dropdown */}
                    <div>
                      <label className="block text-sm text-dark-400 mb-2">برند خودرو</label>
                      <select
                        value={newVehicle.brand}
                        onChange={(e) =>
                          setNewVehicle({ ...newVehicle, brand: e.target.value })
                        }
                        className="input-field w-full"
                      >
                        <option value="">انتخاب برند</option>
                        {CAR_BRANDS.map((brand) => (
                          <option key={brand.value} value={brand.value}>
                            {brand.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Brand Input (when "other" is selected) */}
                    {newVehicle.brand === 'other' && (
                      <Input
                        placeholder="نام برند خودرو را وارد کنید"
                        value={newVehicle.customBrand || ''}
                        onChange={(e) =>
                          setNewVehicle({ ...newVehicle, customBrand: e.target.value })
                        }
                      />
                    )}

                    {/* Model Input */}
                    <Input
                      placeholder="مدل (مثلاً: سورنتو)"
                      value={newVehicle.model}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, model: e.target.value })
                      }
                    />

                    {/* Year Dropdown */}
                    <div>
                      <label className="block text-sm text-dark-400 mb-2">سال ساخت</label>
                      <select
                        value={newVehicle.year}
                        onChange={(e) =>
                          setNewVehicle({ ...newVehicle, year: e.target.value })
                        }
                        className="input-field w-full"
                      >
                        <option value="">انتخاب سال</option>
                        {CAR_YEARS.map((year) => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Plate Number */}
                    <Input
                      placeholder="شماره پلاک (اختیاری)"
                      value={newVehicle.plateNumber}
                      onChange={(e) =>
                        setNewVehicle({ ...newVehicle, plateNumber: e.target.value })
                      }
                    />

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                      onClick={handleCreateVehicle}
                      isLoading={isLoading}
                      disabled={
                        (!newVehicle.brand || (newVehicle.brand === 'other' && !newVehicle.customBrand)) ||
                        !newVehicle.model ||
                        !newVehicle.year
                      }
                      fullWidth
                    >
                      ثبت و ادامه
                    </Button>

                    {vehicles.length > 0 && (
                      <button
                        onClick={() => setShowNewVehicle(false)}
                        className="w-full text-center text-dark-400 hover:text-white text-sm"
                      >
                        انتخاب از خودروهای موجود
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Issues Step */}
          {step === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard padding="lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold-600/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-gold-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    نوع مشکل
                  </h2>
                  <p className="text-dark-400">
                    یک یا چند مورد را انتخاب کنید
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {ISSUE_TYPES.map((issue) => (
                    <button
                      key={issue}
                      onClick={() => toggleIssue(issue)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        selectedIssues.includes(issue)
                          ? 'border-gold-600 bg-gold-600/10 text-white'
                          : 'border-dark-700 text-dark-400 hover:border-dark-600'
                      )}
                    >
                      {issue}
                    </button>
                  ))}
                </div>

                <Input
                  placeholder="توضیحات بیشتر (اختیاری)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mb-4"
                />

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep('vehicle')}>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => setStep('location')}
                    disabled={selectedIssues.length === 0}
                    fullWidth
                  >
                    ادامه
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Location Step */}
          {step === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GlassCard padding="lg">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold-600/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gold-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    موقعیت مکانی
                  </h2>
                  <p className="text-dark-400 text-sm">
                    محل خودرو را روی نقشه مشخص کنید
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Get Current Location Button */}
                  <Button
                    variant="secondary"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    fullWidth
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <Navigation className="w-5 h-5 ml-2" />
                    )}
                    موقعیت فعلی من
                  </Button>

                  {/* Map */}
                  <div className="relative rounded-xl overflow-hidden border border-dark-700">
                    <iframe
                      ref={mapRef}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        (coordinates?.lng || DEFAULT_LNG) - 0.01
                      }%2C${(coordinates?.lat || DEFAULT_LAT) - 0.01}%2C${
                        (coordinates?.lng || DEFAULT_LNG) + 0.01
                      }%2C${(coordinates?.lat || DEFAULT_LAT) + 0.01}&layer=mapnik&marker=${
                        coordinates?.lat || DEFAULT_LAT
                      }%2C${coordinates?.lng || DEFAULT_LNG}`}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      loading="lazy"
                      className="bg-dark-800"
                    />
                    {!coordinates && (
                      <div className="absolute inset-0 bg-dark-950/80 flex items-center justify-center">
                        <p className="text-dark-400 text-sm text-center px-4">
                          برای انتخاب موقعیت، دکمه "موقعیت فعلی من" را بزنید یا آدرس را وارد کنید
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <Input
                    placeholder="آدرس محل خدمت"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    icon={<MapPin className="w-5 h-5" />}
                  />

                  {coordinates && (
                    <p className="text-xs text-dark-500 text-center">
                      مختصات: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </p>
                  )}

                  <label className="flex items-start gap-3 p-4 bg-dark-800/50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-gold-600"
                    />
                    <span className="text-sm text-dark-400">
                      قوانین و مقررات اکسون موتور را خوانده‌ام و می‌پذیرم
                    </span>
                  </label>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep('issues')}>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={handleSubmitOrder}
                      isLoading={isLoading}
                      disabled={!canProceed()}
                      fullWidth
                    >
                      ثبت درخواست
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
