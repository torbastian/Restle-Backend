const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const AES = 'aes-256-cbc';

function hash(string) {
  return bcrypt.hashSync(string, 10);
}

function compare(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword)
}

function encrypt(string) {
    const RANDOM = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(AES, KEY, RANDOM);
	let encryptedString = cipher.update(string, 'utf-8', 'hex');
	encryptedString += cipher.final('hex');
	return RANDOM.toString('hex') + ':' + encryptedString;
}

function decrypt(string) {
	try {
		const toArray = string.split(':');
		const buffer = Buffer.from(toArray[0], 'hex');
		const decipher = crypto.createDecipheriv(AES, KEY, buffer);
		let decryptedString = decipher.update(toArray[1], 'hex', 'utf-8');
		decryptedString += decipher.final('utf-8');
		return decryptedString;
	} catch (error) {
		return string;
	}
}

function decryptBoard(board) {
	board.title = decrypt(board.title);
	board.description = decrypt(board.description);
	console.log(board.owner);
	if(board.owner.last_name && board.owner){
		board.owner.last_name = decrypt(board.owner.last_name);
	}
	
	board.members.forEach(member => {
		if (member.last_name) {
			member.last_name = decrypt(member.last_name);
		}
	});
	
	if (board.lists) {
		board.lists.forEach(list => {
			if (list.title) {
				list.title = decrypt(list.title);
			}
			if (list.cards) {
				list.cards.forEach(card => {
					if (card.title) {
						card.title = decrypt(card.title);
					}
					if (card.description) {
						card.description = decrypt(card.description);
					}
					card.members.forEach(member => {
						if (member.last_name) {
							member.last_name = decrypt(member.last_name);
						}
					});
				});
			}
		});
	}

	return board;
}


exports.hash = hash;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.compare = compare;
exports.decryptBoard = decryptBoard;