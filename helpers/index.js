const Time = require("../models/Time");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const addMinutesToTime = (hours, minutes, minutesToAdd) => {
  // Create a Date object and set the time to the provided hours and minutes
  let time = new Date();
  time.setHours(hours, minutes, 0, 0); // Set to the given hour and minute (e.g., 15:40)
  // Add the minutes to the time
  time.setMinutes(time.getMinutes() + minutesToAdd);
  // Get the updated hours and minutes
  let newHours = time.getHours();
  let newMinutes = time.getMinutes();
  // Format the result to ensure proper 2-digit minute formatting
  return `${newHours}:${newMinutes < 10 ? "0" : ""}${newMinutes}`;
};

const timeToParameters = (timeStr) => {
  let items = [];
  timeStr.map((item) => {
    items.push(item.time.split(":").map(Number));
  });
  return items;
};

const getTimeValues = async (timeRanges) => {
  const result = await Time.find({
    $nor: timeRanges.map((range) => ({
      value: { $gte: range.start, $lte: range.end },
    })),
  });
  return result;
};
const convertWithChooseService = (timeString, serviceDuration) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setMinutes(date.getMinutes() - serviceDuration);
  const newTime = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
  return newTime;
};

// Middleware to protect routes (auth middleware)
const authenticate = (req, res, next) => {
  const token = req.header("Authorization") ? req.header("Authorization") : req.body.headers.Authorization ? req.body.headers.Authorization : req.get('authorization'); 
  if (!token) return res.status(403).send("Access denied");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};

module.exports = {
  getTimeValues,
  timeToParameters,
  addMinutesToTime,
  convertWithChooseService,
  authenticate,
};
