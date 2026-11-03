const dinas = require('../models/dinasModel');

exports.create = async (req, res) => {
    const { kode, nama } = req.body;
    const dinasInstance = await dinas.create({ kode, nama });
    res.status(201).json(dinasInstance);
};

exports.getAll = async (req, res) => {
  res.json(await dinas.find());
};