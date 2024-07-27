exports.orderPlacedEmail = (name, shippingInfo, orderItems, totalPrice, orderId) => {
    
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
        <style>
            body {
                background-color: #ffffff;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #333333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
            }
            .logo {
                max-width: 200px;
                margin-bottom: 20px;
            }
            .message {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 20px;
            }
            .body {
                font-size: 16px;
                margin-bottom: 20px;
            }
            .cta {
                display: inline-block;
                padding: 10px 20px;
                background-color: #FFD60A;
                color: #000000;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                margin-top: 20px;
            }
            .support {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
            .highlight {
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="http://localhost:3000/">
                <img class="logo" src="https://res.cloudinary.com/dbgwuttkx/image/upload/v1710836959/logoBlue_o72cbi.png" alt="Moseta Logo">
            </a>
            <div class="message">Order Placed</div>
            <div class="body">
                <p>Dear ${name},</p>
                <p>Thank you for placing an order with us. We have received your order and will dispatch it soon. <br>
                    We will update you about the order status through email, or you can also check your orders on your customer panel on our website.
                </p>
                <p>Order Details:</p>
                <p>Shipping Address: ${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.postalCode}, ${shippingInfo.country}</p>
                <p>Contact Number: ${shippingInfo.contactNumber}</p>
                <p>Order Id: ${orderId}</p>
            </div>
            <div class="support">If you have any further questions or need immediate assistance, please feel free to reach out to us at <a href="mailto:info@moseta.in">info@moseta.in</a>. We are here to help!</div>
        </div>
    </body>
    </html>`;
};
