const Service = require("../models/Service");

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, price, duration, image } = req.body.params;
    const newService = new Service({ name, price, duration, image });
    await newService.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteService = async (req, res) => {
  try {
    const id = req.params.id;
    await Service.findByIdAndDelete(id);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.putService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration, image } = req.body.params;
    const user = await Service.findByIdAndUpdate(
      id,
      { name, price, duration, image },
      { new: true }
    );
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).json({ message: "Service updated successfully" });
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// Get all services
exports.getServices = async (req, res) => {

  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
