/* eslint-disable */

const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MULTER STORAGE (memory so we can resize then upload)
const multerStorage = multer.memoryStorage();

// MULTER FILTER
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// MULTER
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// UPLOAD USER PHOTO
exports.uploadUserPhoto = upload.single('photo');

// RESIZE + UPLOAD TO CLOUDINARY
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Resize the image in memory
  const buffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toBuffer();

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'natours/users',
        public_id: `user-${req.user.id}-${Date.now()}`,
        format: 'jpg',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });

  // Save the Cloudinary URL so it gets stored in the database
  req.file.filename = result.secure_url;

  next();
});

// FILTER OBJECT
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// GET CURRENT USER
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// UPDATE CURRENT USER
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filter out unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Add uploaded photo URL
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// DELETE CURRENT USER
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// CREATE USER
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

// ADMIN ROUTES
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do not update password with this, only user details
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
