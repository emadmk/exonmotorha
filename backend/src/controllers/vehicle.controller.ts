import { Response } from 'express';
import { Vehicle } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { getFileUrl, deleteFile } from '../middleware/upload.middleware';

/**
 * Get all vehicles for current user
 */
export const getVehicles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const vehicles = await Vehicle.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست خودروها',
    });
  }
};

/**
 * Get single vehicle
 */
export const getVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات خودرو',
    });
  }
};

/**
 * Create new vehicle
 */
export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { brand, model, year, plateNumber, color, isDefault } = req.body;

    if (!brand || !model || !year) {
      res.status(400).json({
        success: false,
        message: 'برند، مدل و سال خودرو الزامی است',
      });
      return;
    }

    // If this is the first vehicle or isDefault is true, unset other defaults
    if (isDefault) {
      await Vehicle.updateMany({ userId }, { isDefault: false });
    }

    const vehicleCount = await Vehicle.countDocuments({ userId });

    const vehicle = await Vehicle.create({
      userId,
      brand,
      model,
      year,
      plateNumber,
      color,
      isDefault: isDefault || vehicleCount === 0,
    });

    res.status(201).json({
      success: true,
      message: 'خودرو با موفقیت اضافه شد',
      vehicle,
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در افزودن خودرو',
    });
  }
};

/**
 * Update vehicle
 */
export const updateVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;
    const { brand, model, year, plateNumber, color, isDefault } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    if (brand) vehicle.brand = brand;
    if (model) vehicle.model = model;
    if (year) vehicle.year = year;
    if (plateNumber !== undefined) vehicle.plateNumber = plateNumber;
    if (color !== undefined) vehicle.color = color;

    if (isDefault && !vehicle.isDefault) {
      await Vehicle.updateMany({ userId }, { isDefault: false });
      vehicle.isDefault = true;
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'اطلاعات خودرو به‌روزرسانی شد',
      vehicle,
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی خودرو',
    });
  }
};

/**
 * Delete vehicle
 */
export const deleteVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    // Delete image if exists
    if (vehicle.image) {
      deleteFile(vehicle.image);
    }

    const wasDefault = vehicle.isDefault;
    await Vehicle.deleteOne({ _id: vehicleId });

    // If deleted vehicle was default, set another one as default
    if (wasDefault) {
      const anotherVehicle = await Vehicle.findOne({ userId });
      if (anotherVehicle) {
        anotherVehicle.isDefault = true;
        await anotherVehicle.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'خودرو با موفقیت حذف شد',
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف خودرو',
    });
  }
};

/**
 * Upload vehicle image
 */
export const uploadVehicleImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'فایل تصویر یافت نشد',
      });
      return;
    }

    // Delete old image if exists
    if (vehicle.image) {
      deleteFile(vehicle.image);
    }

    const imageUrl = getFileUrl(req.file.filename, 'vehicles');
    vehicle.image = imageUrl;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'تصویر خودرو با موفقیت آپلود شد',
      image: imageUrl,
    });
  } catch (error) {
    console.error('Upload vehicle image error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در آپلود تصویر',
    });
  }
};

/**
 * Set vehicle as default
 */
export const setDefaultVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const userId = req.userId;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });

    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    await Vehicle.updateMany({ userId }, { isDefault: false });
    vehicle.isDefault = true;
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'خودرو پیش‌فرض تنظیم شد',
      vehicle,
    });
  } catch (error) {
    console.error('Set default vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تنظیم خودرو پیش‌فرض',
    });
  }
};
