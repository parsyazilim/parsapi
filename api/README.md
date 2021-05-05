# Grocery API

## RUN API locally
You need to create .env file in project directory and add following enviroment variables:

```
# MongoDB url for staging and production
MONGO_DB_URL_STAGING=<mongo_db_url_development>
MONGO_DB_URL_PRODUCTION=<mongo_db_url_production>

# Secret key for JWT token
SECRET=<32_digits_random_string>

# Stripe secret key for card payment
STRIPE_SECRET_KEY=<stripe_secret_key>

# Imagekit for image upload
IMAGEKIT_URL=https://ik.imagekit.io/<imagekit_id>/
IMAGEKIT_PUBLIC_KEY=<imagekit_public_key>
IMAGEKIT_PRIVATE_KEY=<imagekit_private_key>

# Onesignal for user app
ONE_SIGNAL_APP_ID_USER=<onesignal_app_id>
ONE_SIGNAL_SECRET_KEY_USER=<onesignal_secret_key>

# Onesignal for delivery app
ONE_SIGNAL_APP_ID_DELIVERY=<onesignal_app_id>
ONE_SIGNAL_SECRET_KEY_DELIVERY=<onesignal_secret_key>

# Api deployed url for email verification
API_URL_STAGING=<api_deployed_url_development>
API_URL_PRODUCTION=<api_deployed_url_production>

# if true api will use Sendinblue for SMS & Emails
# else api will use Sendgrid for Emails and Twilio for SMS 
USE_SENDINBLUE_EMAIL=true
USE_SENDINBLUE_OTP=true

# Country Code
COUNTRY_CODE=<country_code>

# Twilio for sending SMS 
TWILIO_ACCOUNT_SID=<twilio_account_sid>
TWILIO_AUTH_TOKEN=<twilio_authentication_token>
TWILIO_SID=<twilio_sid>

# Sendgrid for email sending
SENDGRID_KEY=<sendgrid_api_key>
SENDGRID_FROM=<sendgrid_from_email>

# Sendinblue for sending emails and SMS  
SENDINBLUE_HOST_NAME=<sendinblue_host_name>
SENDINBLUE_USER=<sendinblue_user>
SENDINBLUE_PASSWORD=<sendinblue_password>
SENDINBLUE_URL_FOR_OTP=<sendinblue_url>
SENDINBLUE_API_KEY_FOR_OTP=<sendinblue_api_key_for_otp>

# set time format
TIME_SLOT_FORMAT_24HR=true/false
```


## Reset Database with default data
It will delete all data from database and it will set default data.
Do not run it for production otherwise you will loose all data.

```npx ts-node  mongodb-seeding.ts```
