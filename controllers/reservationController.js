const { prettyUrlDataImage } = require("../helpers");
const Reservation = require("../models/Reservation");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Create a new reservation
exports.createReservation = async (req, res) => {
  try {
    const { date, time, service_id, token, customer, employerId } =
      req.body.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const customerName = customer !== "" ? customer : "";
    const customerId = customer !== "" ? null : decoded.id;
    const employerData = employerId === "" ? decoded.id : employerId;
    const status = customer !== "" ? 1 : 0;

    const newReservation = new Reservation({
      date,
      time,
      service: service_id,
      employer: employerData,
      user: customerId,
      customer: customerName,
      status
    });

    await newReservation.save();
    
    res.status(201).json(newReservation);
  } catch (err) {
    console.log("error",err)
    res.status(500).json({ error: err.message });
  }
};

// Get all reservations
exports.getReservations = async (req, res) => {
  const { date, token, check } = req.query;

  console.log("object",check)
  const currentDate = new Date(); // This will be a valid JavaScript Date object
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const dateValue = date ? date : null;
    const emplId = date ? decoded.id : null;
    const customerId = date ? null : decoded.id;
    let reservations = [];
    // Reservation.find({
    //   status: { $nin: [2, 3] }
    // })
    if (!date) {
      reservations = await Reservation.find({
        user: customerId,
        status: {$nin :[2]},
        date:
          check === "true"
            ? { $gte: currentDate.toISOString() }
            : { $lt: currentDate.toISOString() },
      }).sort({date:1})
        .populate("service") // Populate service data
        .populate("employer"); // Populate employee data


        console.log("res",reservations)
    } else {
      reservations = await Reservation.find({
        status: {$nin :[2]},
        date: dateValue,
        employer: emplId,
      })
        .populate("service") // Populate service data
        .populate("user"); // Populate employee data
    }
    res.status(200).json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.patchReservationById = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body.params;
      const reservation = await Reservation.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (!reservation) {
        return res.status(404).send("Reservation not found");
      }
      res.status(200).json({ message: "Reservation is cancelled successfully" });
    } catch (error) {
      res.status(500).send("Server Error");
    }
}

exports.getReservationById = async (req,res) => {
  const { id } = req.params;

  console.log("::::",req.params,req.query)
  try {
    const reservationItem = await Reservation.findOne({ _id: id })
      .populate({
        path: "service",
        select: "id name duration price image",
        transform: (doc) => {
          if (doc.image) {
            // Assuming the image field stores the relative path
            // doc.image = `http://10.58.158.121:5000/${doc.image}`; // Construct the full URL
            doc.image =prettyUrlDataImage(`${process.env.API_URL}/${doc.image}`)

          }
          return doc;
        },
      })
      .populate({
        path: "user",
        select: "id name image",
        transform: (doc) => {
          if (doc.image) {
            // Assuming the image field stores the relative path
            doc.image =prettyUrlDataImage(`${process.env.API_URL}/${doc.image}`)
          }
          return doc;
        },
      }); // Populate employee data;
    res.status(200).json(reservationItem);

    
  } catch (error) {
    console.log("object",error)
    res.status(500).json({ error: err.message });
    
  }
}
