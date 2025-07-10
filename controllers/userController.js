const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    institution,
    academicDegree,
    researchInterests,
    orcidId,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    institution,
    academicDegree,
    researchInterests,
    orcidId,
  });

  if (user) {
    const token = generateToken(user._id);

    // ✅ Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // use HTTPS in prod
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // ✅ Send user data (excluding password)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      institution: user.institution,
      token, // optional: include in body too if frontend needs it
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


// @desc    Authenticate user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);

    // Guarantee isAdmin and role are always present and correct
    let isAdmin = user.isAdmin;
    let role = user.role;
    if (typeof isAdmin !== 'boolean') isAdmin = false;
    if (!role) role = isAdmin ? 'admin' : 'user';

    // ✅ Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin,
      role,
      institution: user.institution,
      token, // optional
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});


// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      institution: user.institution,
      academicDegree: user.academicDegree,
      researchInterests: user.researchInterests,
      orcidId: user.orcidId,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.institution = req.body.institution || user.institution;
    user.academicDegree = req.body.academicDegree || user.academicDegree;
    user.researchInterests = req.body.researchInterests || user.researchInterests;
    user.orcidId = req.body.orcidId || user.orcidId;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Generate new token
    const token = generateToken(updatedUser._id);

    // Set the token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      role: updatedUser.role,
      institution: updatedUser.institution,
      token: token, // Optional: in case frontend still uses it from body
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};