exports.resetPassword = (name , resetPasswordUrl) => {
	return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Forgot Password</title>
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
            <a href="https://studynotion-edtech-project.vercel.app"><img class="logo"
                src="https://res.cloudinary.com/dbgwuttkx/image/upload/v1710836959/logoBlue_o72cbi.png" alt="Moseta Logo"></a>
            
                <div class="message">Password Reset</div>

            <div class="body">
                <p>Hey ${name},</p>
                <p>Click on the following link to continue resetting your password : \n. </p>
                <p>${resetPasswordUrl}</p>
                <p>If you did not request this password change, please contact us immediately to secure your account.</p>
            </div>

            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us
                at
                <a href="mailto:info@moseta.in">info@moseta.in</a>. We are here to help!
            </div>
        </div>
    </body>
    
    </html>`;
};