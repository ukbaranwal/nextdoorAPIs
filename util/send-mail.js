const nodemailer = require("nodemailer");
const smtpEndpoint = "email-smtp.ap-south-1.amazonaws.com";
const port = 587;
const senderAddress = "Next Door <info@next-door.co.in>";
const smtpUsername = "AKIAYJNNJKB4FBZJGPZE";
const smtpPassword = "BK4rBXI96VdPoq+SPMtLLuwROHLt/t69UioMAzWaXHtU";

// CC and BCC addresses. If your account is in the sandbox, these
// addresses have to be verified. To specify multiple addresses, separate
// each address with a comma.
// var ccAddresses = "cc-recipient0@example.com,cc-recipient1@example.com";
// var bccAddresses = "bcc-recipient@example.com";

// The message tags that you want to apply to the email.
var tag0 = "key0=value0";
var tag1 = "key1=value1";



exports.sendEmail = (toAddress, subject, body_html) => {
    var body_text = `Amazon SES Test (Nodemailer)
---------------------------------
This email was sent through the Amazon SES SMTP interface using Nodemailer.
`;
    let transporter = nodemailer.createTransport({
        host: smtpEndpoint,
        port: port,
        secure: false, // true for 465, false for other ports
        auth: {
            user: smtpUsername,
            pass: smtpPassword
        }
    });
    let mailOptions = {
        from: senderAddress,
        to: toAddress,
        subject: subject,
        text: body_text,
        html: body_html,
        // Custom headers for configuration set and message tags.
        headers: {
            'X-SES-MESSAGE-TAGS': tag0,
            'X-SES-MESSAGE-TAGS': tag1
        }
    };
    return transporter.sendMail(mailOptions)
    .then(result=>{
        console.log(result);
    }).catch(err =>{
        console.log(err);
    })
};