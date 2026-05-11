import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Address } from '../models/Address';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendNotFound, sendBadRequest } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Get all addresses for user
export const getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };

  const [rawAddresses, total] = await Promise.all([
    Address.find(filter).sort({ isDefault: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Address.countDocuments(filter),
  ]);

  // Normalise _id → id so the frontend Address interface matches
  const addresses = rawAddresses.map((a: any) => ({
    ...a,
    id: a._id?.toString() ?? '',
    _id: undefined,
    __v: undefined,
  }));

  const totalPages = Math.ceil(total / limit);

  sendSuccess(
    res,
    {
      addresses,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
    'Addresses retrieved successfully',
  );
});

// Get single address by ID
export const getAddressById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return sendBadRequest(res, 'Invalid address ID');
  }

  const rawAddress = await Address.findOne({ _id: id, user: req.user._id }).lean();

  if (!rawAddress) {
    return sendNotFound(res, 'Address not found');
  }

  const address = {
    ...(rawAddress as any),
    id: (rawAddress as any)._id?.toString() ?? '',
    _id: undefined,
    __v: undefined,
  };
  sendSuccess(res, address, 'Address retrieved successfully');
});

// Create new address
export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const {
    type,
    title,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode: _postalCode,
    pincode: _pincode,
    zipCode: _zipCode,
    country,
    coordinates,
    isDefault,
    instructions,
  } = req.body;

  // Normalize all postal code variants — canonical field is postalCode
  const postalCode = (_postalCode || _pincode || _zipCode || '') as string;

  if (!addressLine1 || typeof addressLine1 !== 'string' || addressLine1.trim().length === 0) {
    return sendBadRequest(res, 'Address line 1 is required');
  }
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return sendBadRequest(res, 'City is required');
  }
  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    return sendBadRequest(res, 'State is required');
  }
  if (!postalCode || postalCode.trim().length === 0) {
    return sendBadRequest(res, 'Postal code is required');
  }
  if (!country || typeof country !== 'string' || country.trim().length === 0) {
    return sendBadRequest(res, 'Country is required');
  }

  const addressData = {
    type,
    title,
    phone,
    addressLine1: addressLine1.trim(),
    addressLine2: addressLine2?.trim(),
    city: city.trim(),
    state: state.trim(),
    postalCode: postalCode.trim(),
    country: country.trim(),
    coordinates,
    isDefault,
    instructions,
    user: req.user._id,
  };

  const address = await Address.create(addressData);

  sendSuccess(res, address, 'Address created successfully', 201);
});

// Update address
export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return sendBadRequest(res, 'Invalid address ID');
  }

  // Find address and ensure it belongs to the user
  const address = await Address.findOne({ _id: id, user: req.user._id });

  if (!address) {
    return sendNotFound(res, 'Address not found');
  }

  // Update only allowed address fields
  const {
    type,
    title,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode: _postalCode,
    pincode: _pincode,
    zipCode: _zipCode,
    country,
    coordinates,
    isDefault,
    instructions,
  } = req.body;

  // Normalize postal code variants on update
  const postalCode = _postalCode ?? _pincode ?? _zipCode;

  const allowedUpdates = {
    type,
    title,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    coordinates,
    isDefault,
    instructions,
  };

  // Only assign defined fields
  for (const [key, value] of Object.entries(allowedUpdates)) {
    if (value !== undefined) {
      (address as any)[key] = value;
    }
  }
  await address.save();

  sendSuccess(res, address, 'Address updated successfully');
});

// Delete address
export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return sendBadRequest(res, 'Invalid address ID');
  }

  const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

  if (!address) {
    return sendNotFound(res, 'Address not found');
  }

  sendSuccess(res, { deletedId: id }, 'Address deleted successfully');
});

// Set default address
export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  // Find address and ensure it belongs to the user
  const address = await Address.findOne({ _id: id, user: req.user._id });

  if (!address) {
    return sendNotFound(res, 'Address not found');
  }

  // Update all addresses to non-default
  await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });

  // Set this address as default
  address.isDefault = true;
  await address.save();

  sendSuccess(res, address, 'Default address updated successfully');
});
