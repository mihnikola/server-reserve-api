const User = require("../models/User");
var bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { prettyUrlDataImage } = require("../helpers");
// Create a transporter to send emails using Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: false,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

// Create a new admin user
exports.createAdminUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      token: verificationToken,
      role: "",
    });
    await newUser.save();

    const address = `${process.env.FRONTEND_API_URL}/verify/${verificationToken}`;

    const mailOptions = {
      from: "FTA <fusiontechagent@gmail.com>",
      to: email,
      subject: "Please Verify Your Email Address",
      html: `<p>Hello ${name},</p><p>Thank you for registering! 
      Please click the link below to verify your email address:</p><a href=${address}>Verify Email</a>     <p>This link will expire in 1 hour.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });

    res.status(201).json({
      message:
        "User created successfully! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Error:", err); // Log error to console
    res.status(500).json({ error: err.message });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      token: verificationToken,
    });
    await newUser.save();

    const address = `${process.env.FRONTEND_API_URL}/verify/${verificationToken}`;

    const mailOptions = {
      from: "FTA <fusiontechagent@gmail.com>",
      to: email,
      subject: "Please Verify Your Email Address",
      html: `<p>Hello ${name},</p><p>Thank you for registering! 
      Please click the link below to verify your email address:</p><a href=${address}>Verify Email</a>     <p>This link will expire in 1 hour.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });

    res.status(201).json({
      message:
        "User created successfully! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Error:", err); // Log error to console
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query; // The token is sent as part of the URL
  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find the user with the decoded email
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token." });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified." });
    }

    // Mark the user as verified
    user.isVerified = true;
    user.token = null; // Clear the token once used
    await user.save();
    res
      .status(200)
      .json({ message: "Your email has been verified! You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify the token." });
  }
};

//loginAdminUser
exports.loginAdminUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user in the "database"
    const user = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Not match password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Not verified" });
    }

    if (user.role !== "administrator") {
      if (user.role !== "employer") {
        return res.status(400).json({ message: "Not permission" });
      }
    }

    const userData = {
      id: user._id,
      role: user.role,
    };

    // Create JWT token
    const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res.status(200).json({ token });
    // Send the token as a response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user in the "database"
    const user = await User.findOne({ email }); // `findOne` is typically better if you expect a single result

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Not match password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Not verified" });
    }

    const userData = {
      id: user._id,
      email: user.email,
    };
    // Create JWT token
    const token = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
      expiresIn: "10000000m",
    });
    res.status(200).json({ token });
    // Send the token as a response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $exists: true, $ne: null } });
    const usersData = users.map((user) => {
      return {
        id: user._id,
        name: user.name,
        role: user.role,
        image: prettyUrlDataImage(`${process.env.API_URL}/${user.image}`)
      };
    });
    res.status(200).json(usersData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const token = req.params.id;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findOne({ _id: decoded.id });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.patchUser = async (req,res) =>{
    try {
      const { id } = req.params;
      const { name, image } = req.body.params;
  
      const user = await User.findByIdAndUpdate(
        id,
        { name, image },
        { new: true }
      );
      if (!user) {
        return res.status(404).send("User not found");
      }
  
      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).send("Server Error");
    }
  };
