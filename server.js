require('dotenv').config()

const express = require("express"),
         cors = require("cors"),
         path = require("path"),
         {SERVER_PORT, STATIC_DIR, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY} = process.env //importing env values
         
const sc = require('./stripeController')
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(express.static(process.env.STATIC_DIR));
app.use(cors());
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function (req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Node server listening on port ${port}!`));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname+'/client/index.html'));
});

// Fetch the Checkout Session to display the JSON result on the success page
app.get("/api/checkout-session", async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
});

app.post("/api/create-checkout-session", async (req, res) => {
    const basicPlan = 'price_1H5ZrIJjU6H0KLWFQbb42Czu'
    const domainURL = process.env.DOMAIN;
    const priceId = basicPlan;
  
    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
      success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainURL}/canceled.html`,
      allow_promotion_codes: true,
    });
  
    res.send({
      sessionId: session.id,
    });
  });
  

app.get("/api/setup", (req, res) => {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      basicPrice: process.env.BASIC_PRICE_ID,
      proPrice: process.env.PRO_PRICE_ID,
    });
  });

//stripe endpoints
app.post('/api/create-session', sc.makeSession)
