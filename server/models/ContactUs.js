const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const { contactUsEmail } = require("../mailTemplate/contactUs");

const contactUsSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    contactNumber: {
        type: Number,
    },

    email: {
        type: String,
        required: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },

    subject: {
        type: String,
        required: true
    },
    
    message: {
        type: String,
        required: true
    },

}, { timestamps: true });

module.exports = mongoose.model("ContactUs", contactUsSchema);





// Send contact email function
async function sendConfirmationEmail(email, name) {
    try {
        const mailResponse = await mailSender(
            email,
            "Contact",
            contactUsEmail(email , name , message , contactNumber)
        );
        console.log("Email sent successfully: ", mailResponse?.response);
    } catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }
}


// Send registration email after saving
contactUsSchema.post('save', async function (doc, next) {
    if (doc.isNew) {
        await sendConfirmationEmail(doc.email, doc.firstName);
    }
    next();
});