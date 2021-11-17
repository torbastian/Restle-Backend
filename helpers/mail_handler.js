var nodemailer = require('nodemailer');

function SendEmail(reciver){
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'restlehej@gmail.com',
          pass: '1234567890Qwertyuiop'
        }
      });
    var mailOptions = {
        from: 'restlehej@gmail.com',
        to: reciver,
        subject: 'Password reset',
        text: 'That was easy!'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
    
exports.SendEmail = SendEmail;



