const router = require('express').Router();
const { ValidateToken } = require('../helpers/token_handler');
const Board = require('../models/board_model');
const User = require('../models/user_model');

router.get('/admin', ValidateToken, async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user || !user.isAdmin) return res.status(400).send({ message: 'Denied' });

  var page = 1;
  var limit = 10;

  if (req.query.page != undefined) {
    page = req.query.page;
  }

  if (req.query.limit != undefined) {
    limit = req.query.limit;
  }

  //Term er om der bliver søgt på title, ejer, eller medlem
  //Search er hvad selve søgningen inkludere
  const validSearch = req.query.term && req.query.search && req.query.term != '' && req.query.search != '';

  try {
    var boards = null;
    var count = null;

    if (validSearch) {
      boards = await Board.find()
        .sort({ 'last_edited': -1 })
        .populate({
          path: 'members',
          select: 'username create_date first_name last_name colour'
        })
        .populate({
          path: 'owner',
          select: 'username create_date first_name last_name colour'
        })
        .exec();

    } else {
      boards = await Board.find()
        .sort({ 'last_edited': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate({
          path: 'members',
          select: 'username create_date first_name last_name colour'
        })
        .populate({
          path: 'owner',
          select: 'username create_date first_name last_name colour'
        })
        .exec();

      count = await Board.countDocuments();
    }

    //Decrypt SENERE

    if (validSearch) {

    }

    return res.status(200).send({
      boards: boards,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    console.log(err);
  }

  await Board.find()
});

module.exports = router;