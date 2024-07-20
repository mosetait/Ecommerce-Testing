const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {

    try{
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        
            let info = await transporter.sendMail({
                from: 'Moseta - Renewable luxury',
                to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
            })
            // console.log(info);
            return info;
    }
    catch(error) {
        console.log(error);
    }
}



module.exports = mailSender;