const laporan = require('../models/articlesModel');
const categories = require('../models/categoriesModel');
const { errorHttp } = require('../middlewares/errorHandler');

const LIMIT_DEFAULT = 10;
const LIMIT_MAKS = 50;
const FIELD_SORT = ['judul', 'articlesId', 'createdAt'];
const FIELD_BOLEH_DIPILIH = ['judul', 'articlesId', 'bioPenulis', 'categoriesId', 'createdAt'];

// Mengubah bilangan dari query string menjadi bilangan bulat yang aman
function angkaAman(nilai, bawaan, min, maks) {
  const n = parseInt(nilai, 10);
  if (Number.isNaN(n)) return bawaan;
  return Math.min(Math.max(n, min), maks);
}

exports.create = async (req, res) => {
    const { judul, articlesId, bioPenulis, categoriesId } = req.body;
    const articles = await articles.create({ judul, articlesId, bioPenulis, categoriesId });
    res.status(201).json(articles);
};

exports.getAll = async (req, res) => {
  // 1. Filtering
   const filter = {};
  if (req.query.pekerjaan) {
    filter['bioPenulis.pekerjaan'] = String(req.query.pekerjaan);
  }
  if (req.query.categories) {
    const category = await categories.findOne({ kode: String(req.query.categories).toUpperCase() });
    // Kode kategori tidak dikenal -> hasil kosong ($in: [] tidak cocok dengan apa pun)
    filter.categoriesId = category ? category._id : { $in: [] };
  }
  // 2. Pagination dengan batas maksimum
   const page = angkaAman(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = angkaAman(req.query.limit, LIMIT_DEFAULT, 1, LIMIT_MAKS);

  // Sorting: ?sort=judul (naik) atau ?sort=-judul (turun). Bawaan: terbaru dulu
  // 3. Sorting: ?sort=judul (naik) atau ?sort=-judul (turun). Bawaan: terbaru dulu
  const sortParam = String(req.query.sort || '-createdAt');
  const arah = sortParam.startsWith('-') ? -1 : 1;
  const sortField = sortParam.replace(/^-/, '');
  if (!FIELD_SORT.includes(sortField)) {
    throw errorHttp(400, `sort hanya boleh: ${FIELD_SORT.join(', ')}`);
  }

  //4.  Projection: ?fields=judul,categoriesId
  let select = '';
  if (req.query.fields) {
    const fields = String(req.query.fields).split(',').map((f) => f.trim());
    if (!fields.every((f) => FIELD_BOLEH_DIPILIH.includes(f))) {
      throw errorHttp(400, `fields hanya boleh: ${FIELD_BOLEH_DIPILIH.join(', ')}`);
    }
    select = fields.join(' ');
  }

  // const [data, total] = await Promise.all([
  //   articles.find(filter)
  //     .populate('categoriesId', 'kode nama')
  //     .sort({ [sortField]: arah, _id: 1 })
  //     .skip((page - 1) * limit)
  //     .limit(limit),
  //   articles.countDocuments(filter),
  // ]);

    const query = articles.find(filter)
    .select(select)
    .sort({ [sortField]: arah, _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Populate kategori hanya jika categoriesId diminta (atau tanpa projection).
  if (!select || select.split(' ').includes('categoriesId')) {
    query.populate('categoriesId', 'kode nama');
  }

  const [data, total] = await Promise.all([query, articles.countDocuments(filter)]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
};

exports.getById = async (req, res) => {
  const data = await articles.findById(req.params.id).populate('categoriesId');
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.json(data);
};

exports.update = async (req, res) => {
  const { judul, articlesId, bioPenulis, categoriesId } = req.body;
  const data = await articles.findByIdAndUpdate(
    req.params.id,
    { judul, articlesId, bioPenulis, categoriesId },
    { returnDocument: 'after', runValidators: true }
  );
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.json(data);
};

exports.remove = async (req, res) => {
  const data = await articles.findByIdAndDelete(req.params.id);
  if (!data) throw errorHttp(404, 'Data tidak ditemukan');
  res.status(204).send();
};