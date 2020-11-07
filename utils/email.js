const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (to, subject, templateId, dynamic_template_data) => {
    const msg = {
        to: to,
        from: 'obada_567@hotmail.co.uk',
        subject: subject,
        template_id: templateId,
        dynamic_template_data: dynamic_template_data,
    };
    sgMail.send(msg);
};
module.exports = sendEmail;
